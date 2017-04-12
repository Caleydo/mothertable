/**
 * Created by Samuel Gratzl on 01.02.2017.
 */

import 'select2';
import * as d3 from 'd3';
import * as $ from 'jquery';
import IDType from 'phovea_core/src/idtype/IDType';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';
import FilterManager from './filter/FilterManager';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IAnyVector} from 'phovea_core/src/vector';
import {asVector} from 'phovea_core/src/vector';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {IFilterAbleType} from './filter/FilterManager';
import {AnyColumn, dataValueTypeCSSClass, dataValueType} from './column/ColumnManager';
import {hash} from 'phovea_core/src/index';
import AColumn from './column/AColumn';
import {formatAttributeName, formatIdTypeName} from './column/utils';
import {IStratification} from 'phovea_core/src/stratification';
import AFilter from './filter/AFilter';
import {AVectorFilter} from './filter/AVectorFilter';


export interface IFuelBarDataSize {
  total: number;
  filtered: number;
}

export default class SupportView extends EventHandler {


  static EVENT_DATASETS_ADDED = 'datasetAdded';
  static EVENT_FILTER_CHANGED = FilterManager.EVENT_FILTER_CHANGED;

  private static readonly HASH_FILTER_DELIMITER = ',';

  $node: d3.Selection<any>;
  private $fuelBar: d3.Selection<any>;

  private _filterManager: FilterManager;
  private _matrixData: Map<string, INumericalMatrix> = new Map();
  private datasets: IDataType[];
  private supportViewNode;

  constructor(public readonly idType: IDType, $parent: d3.Selection<any>, public readonly id: number) {
    super();
    this.build($parent);
  }

  private get idTypeHash() {
    return this.idType.id + '_' + this.id;
  }

  get filterManager(): FilterManager {
    return this._filterManager;
  }

  private build($parent) {
    const $wrapper = $parent.append('div')
      .classed(`support-view-${this.idType.id}`, true)
      .classed(`support-view`, true);

    $wrapper.append('h1')
      .classed('idType', true)
      .html(formatIdTypeName(this.idType.name));

    this.$fuelBar = $wrapper.append('div')
      .classed(`dataPreview-${this.idType.id}`, true)
      .classed(`fuelBar`, true);

    this.$fuelBar.append('div').classed('totalData', true);
    this.$fuelBar.append('div').classed('filteredData', true);

    this.$node = $wrapper.append('div').classed(this.idType.id, true);
    this.supportViewNode = $wrapper;
  }

  async init() {
    this.setupFilterManager();
    await this.loadDatasets();
    this.buildSelect2(this.$node);
    await this.addInitialFilters();
  }

  private async loadDatasets() {
    this.datasets = convertTableToVectors(await listData())
      .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d));

    if (this.idType.id !== 'artist' && this.idType.id !== 'country') {
      const vectorsOnly = this.datasets.filter((d) => d.desc.type === AColumn.DATATYPE.vector);
      if (vectorsOnly.length > 0) {
        const idStrings = await (<IAnyVector>vectorsOnly[0]).names();
        const idVector = asVector(idStrings, idStrings, {
          name: formatIdTypeName(this.idType.name),
          idtype: `${this.idType}`
        });
        this.datasets.push(idVector);
      }
    }
  }


  async addFilter(dataset) {
    const data = await this.addDataset(dataset);
    this.fire(SupportView.EVENT_DATASETS_ADDED, [data]);
    this.updateURLHash();
  }


  updateFilterView(col) {

    this.filterManager.updateFilterView(col);
    this.updateURLHash();

  }

  private setupFilterManager() {
    this._filterManager = new FilterManager(this.idType, this.$node);
    this._filterManager.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.updateURLHash();
      this.fire(FilterManager.EVENT_SORT_DRAGGING, data);
    });
    this._filterManager.on(AFilter.EVENT_REMOVE_ME, (evt: any, data: IDataType) => {
      this.updateURLHash();
    });


    this.filterManager.on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, data) => {
      this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, data);
    });

    this.propagate(this._filterManager, FilterManager.EVENT_FILTER_CHANGED);
  }

  private async addInitialFilters() {
    if (hash.has(this.idTypeHash)) {
      const datasets = await Promise.all(hash.getProp(this.idTypeHash)
        .split(SupportView.HASH_FILTER_DELIMITER)
        .map((name) => this.datasets.filter((d) => d.desc.name === name)[0])
        .filter((data) => data !== undefined)
        .map((data) => {
          return this.addDataset(data);
        }));
      this.fire(SupportView.EVENT_DATASETS_ADDED, datasets);
    }
  }

  private updateURLHash() {
    // add random id to hash
    hash.setProp(this.idTypeHash,
      this._filterManager.filters
        .map((d) => d.data.desc.name)
        .join(SupportView.HASH_FILTER_DELIMITER)
    );
  }

  destroy() {
    this._filterManager.off(FilterManager.EVENT_SORT_DRAGGING, null);
    this.$node.remove();
    this.supportViewNode.remove();
    this.filterManager.destroy();
    this.updateURLHash();

  }

  sortByColumnHeader(sortColdata) {
    this.filterManager.primarySortColumn(sortColdata);
  }

  sortFilterByHeader(sortColdata) {
    this.filterManager.updateSortIcon(sortColdata);
  }


  /**
   * Returns the matrix data for a given dataset id
   * @param datasetId
   * @returns {undefined|INumericalMatrix}
   */
  getMatrixData(datasetId: string): INumericalMatrix {
    return this._matrixData.get(datasetId);
  }

  public remove(data: IDataType) {
    if (this._filterManager.contains(<IFilterAbleType>data)) {
      this._filterManager.remove(null, <IFilterAbleType>data);
      this.updateURLHash();
    }
  }

  private buildSelect2($parent: d3.Selection<any>) {
    (<HTMLElement>$parent.node()).insertAdjacentHTML('afterbegin', `<div class="selection"> 
      <select class="form-control">
        <option></option>
      </select>
    </div>`);

    const $select = $parent.select('select').property('selectedIndex', -1);

    this.addExplicitColors(this.datasets);

    const availableDataTypes = this.datasets
      .map((d) => d.desc.type)
      .sort()
      .filter((el, i, a) => {
        if (i === a.indexOf(el)) {
          return 1;
        }
        return 0;
      });

    const defaultData = availableDataTypes.map((type) => {
      const children = this.datasets
        .filter((d) => d.desc.type === type)
        .map((d, i) => {
          return {
            id: d.desc.id,
            text: formatAttributeName(d.desc.name),
            dataType: d.desc.type,
            valueType: dataValueType(d),
            data: d
          };
        });

      return {
        text: type,
        dataType: type,
        children
      };
    });

    const defaultOptions = {
      data: defaultData,
      placeholder: 'Select Attribute',
      allowClear: true,
      theme: 'bootstrap',
      //selectOnClose: true,
      //escapeMarkup: (markup) => markup,
      templateResult: (item: any) => {
        if (!item.id) {
          return $(`<span>${item.text}</span>`);
        }
        return $(`<span><i class="${dataValueTypeCSSClass(item.valueType)}" aria-hidden="true"></i> ${item.text}</span>`);
      },
      templateSelection: (item: any) => {
        if (!item.id) {
          return $(`<span>${item.text}</span>`);
        }
        return $(`<span><i class="${dataValueTypeCSSClass(item.valueType)}" aria-hidden="true"></i> ${item.text}</span>`);
      },
    };

    const $jqSelect2 = (<any>$($select.node()))
      .select2(defaultOptions)
      .on('select2:select', async (evt) => {
        const dataset = evt.params.data.data;

        // reset selection
        $jqSelect2.val(null).trigger('change');

        // load data and add columns
        this.addFilter(dataset);

        return false;
      });

    return $jqSelect2;
  }

  /**
   * Special function to define colors for the TCGA dataset
   * @param datasets
   * @returns {Promise<void>}
   */
  private async addExplicitColors(datasets) {
    const color = [
      ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f'],
      ['#1b9e77', '#1d9ee8', '#d97979', '#e7298a', '#66a61e', '#e6ab02'],
      ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c'],
      ['#e41a1c', '#377eb8', '#984ea3', '#ff7f00', '#ffff33'],
      ['#8dd3c7', '#fdb462', '#bebada', '#fb8072', '#80b1d3', '#fdb462'],
      ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f']
    ];

    datasets.forEach((tableVector, j) => {
      if ((tableVector.desc.type === 'vector' || tableVector.desc.type === 'matrix') && tableVector.desc.value.type === 'categorical') {
        const categories = tableVector.desc.value.categories;
        categories.forEach((v, i) => {
          if (v.color === undefined) {
            tableVector.desc.value.categories[i] = {name: v, color: color[j - 4][i]};
          }
          if (v.label !== undefined) {
            tableVector.desc.value.categories[i] = {name: v.name, color: color[j - 4][i]};
          }
        });
      }
    });
  }

  private async addDataset(data: IDataType) {
    if (data.desc.type === 'stratification') {
      data = await (<IStratification>data).asVector();
    }
    if (!this._filterManager.contains(<IFilterAbleType>data)) {
      this._filterManager.push(<IFilterAbleType>data);
    }
    if (data.desc.type === AColumn.DATATYPE.matrix) {
      this._matrixData.set(data.desc.id, <INumericalMatrix>data);
    }
    return data;
  }

  public updateFuelBar(dataSize: IFuelBarDataSize) {
    const availableWidth = parseFloat(this.$fuelBar.style('width'));
    const total = (dataSize.total);
    const filtered = (dataSize.filtered) || 0;
    const totalWidth = availableWidth / total * filtered;

    this.$fuelBar.select('.totalData').style('width', `${totalWidth}px`);
    this.$fuelBar.select('.filteredData').style('width', `${availableWidth - totalWidth}px`);
  }

}


export function isPossibleDataset(data: IDataType) {
  switch (data.desc.type) {
    case 'vector':
      const v = <IAnyVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return true;
        case VALUE_TYPE_CATEGORICAL:
          return true;
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return true;
      }
      return false;
    case 'matrix':
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return true;
      }
      return false;
    case 'stratification':
      return true;
    default:
      return false;
  }
}

export function transposeMatrixIfNeeded(rowtype: IDType, d: IDataType) {

  // tranpose if the rowtype is not the target one
  if (d.desc.type === 'matrix' && d.idtypes[0] !== rowtype) {
    return (<INumericalMatrix>d).t;
  }

  return d;
}
