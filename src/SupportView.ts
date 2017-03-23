/**
 * Created by Samuel Gratzl on 01.02.2017.
 */

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
import {IFilterAbleType} from 'mothertable/src/filter/FilterManager';
import {AnyColumn} from './column/ColumnManager';
import {hash} from 'phovea_core/src/index';
import AColumn from './column/AColumn';
import {formatAttributeName, formatIdTypeName} from './column/utils';
import {IStratification} from 'phovea_core/src/stratification';


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

  private filterManager: FilterManager;
  private _matrixData: Map<string, INumericalMatrix> = new Map();
  private datasets: IDataType[];

  constructor(public readonly idType: IDType, $parent: d3.Selection<any>, public readonly id: number) {
    super();
    this.build($parent);
    this.init();
  }

  private get idTypeHash() {
    return this.idType.id + '_' + this.id;
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
  }

  private async init() {
    this.setupFilterManager();

    await this.loadDatasets();
    this.buildSelectionBox(this.$node);
    this.addInitialFilters();
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

  private setupFilterManager() {
    this.filterManager = new FilterManager(this.idType, this.$node);
    this.filterManager.on(FilterManager.EVENT_SORT_DRAGGING, (evt: any, data: AnyColumn[]) => {
      this.updateURLHash();
      this.fire(FilterManager.EVENT_SORT_DRAGGING, data);
    });

    this.propagate(this.filterManager, FilterManager.EVENT_FILTER_CHANGED);
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
      this.filterManager.filters
        .map((d) => d.data.desc.name)
        .join(SupportView.HASH_FILTER_DELIMITER)
    );
  }

  destroy() {
    this.filterManager.off(FilterManager.EVENT_SORT_DRAGGING, null);
    this.$node.remove();
  }

  primarySortColumn(sortColdata) {
    this.filterManager.primarySortColumn(sortColdata);
  }

  /**
   * Returns the matrix data for a given dataset id
   * @param datasetId
   * @returns {undefined|INumericalMatrix}
   */
  getMatrixData(datasetId:string):INumericalMatrix {
    return this._matrixData.get(datasetId);
  }

  public remove(data: IDataType) {
    if (this.filterManager.contains(<IFilterAbleType>data)) {
      this.filterManager.remove(<IFilterAbleType>data);
      this.updateURLHash();
    }
  }

  private buildSelectionBox($parent: d3.Selection<any>) {

    (<HTMLElement>$parent.node()).insertAdjacentHTML('afterbegin', `<div class="selection"> 
       <select class="form-control">
       <option value="attribute">Select Attribute</option>             
      </select>
    </div>`);

    const $select = $parent.select('select');

    this.addExplicitColors(this.datasets);

    // list all data, filter to the matching ones, and prepare them
    // const datasets = convertTableToVectors(await listData())
    //   .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d))
    // datasets.map((d) => transposeMatrixIfNeeded(this.idType, d));

    this.datasets.forEach((d) => {
      $select.append('option')
        .text(formatAttributeName(d.desc.name))
        .attr('value', d.desc.id);
    });

    $select.on('change', async (evt) => {
      const index = $select.property('selectedIndex');
      if (index === 0) { // empty selection
        return false;
      }
      // -1 because of empty option
      let data = this.datasets[index - 1];

      data = await this.addDataset(data);
      this.fire(SupportView.EVENT_DATASETS_ADDED, [data]);

      this.updateURLHash();
      // reset selection
      $select.property('selectedIndex', 0);
      return false;
    });
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
    if (!this.filterManager.contains(<IFilterAbleType>data)) {
      this.filterManager.push(<IFilterAbleType>data);
    }
    if(data.desc.type === AColumn.DATATYPE.matrix) {
      this._matrixData.set(data.desc.id, <INumericalMatrix>data);
    }
    return data;
  }

  public updateFuelBar(dataSize:IFuelBarDataSize) {
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
