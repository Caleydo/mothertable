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
import {INumericalMatrix, IAnyMatrix} from 'phovea_core/src/matrix';
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
import TableVector from 'phovea_core/src/table/internal/TableVector';
import Vector from 'phovea_core/src/vector/Vector';


export interface IFuelBarDataSize {
  total: number;
  filtered: number;
}

export default class SupportView extends EventHandler {


  static EVENT_DATASETS_ADDED = 'datasetAdded';
  static EVENT_FILTER_CHANGED = FilterManager.EVENT_FILTER_CHANGED;

  private static readonly HASH_FILTER_DELIMITER = ';';

  $node: d3.Selection<any>;
  private $fuelBar: d3.Selection<any>;

  private _filterManager: FilterManager;
  private _matrixData = new Map<string, INumericalMatrix>();

  private datasets: IDataType[];
  private supportViewNode;

  constructor(public readonly idType: IDType, $parent: d3.Selection<any>, public readonly id: number) {
    super();
    this.build($parent);
  }

  get idTypeHash() {
    return this.idType.id + '_' + this.id;
  }

  get filterManager(): FilterManager {
    return this._filterManager;
  }

  private build($parent: d3.Selection<any>) {
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
    // add default column here
    this.addDefaultColumn();
    await this.addInitialFilters();
  }

  private addDefaultColumn() {
    const stringColumn = this.datasets.find((x) => (x instanceof TableVector || x instanceof Vector) && x.desc.value.type === VALUE_TYPE_STRING);

    // string column available?
    if (!stringColumn) {
      console.error(`No string column for idType '${this.idType.name}' found!`);
      return;
    }

    // check if we have already added a string column
    if (hash.has(this.idTypeHash)) {
      const attributeArray = hash
        .getProp(this.idTypeHash)
        .split(SupportView.HASH_FILTER_DELIMITER);

      if (attributeArray.indexOf(stringColumn.desc.id) > -1) {
        return; // if a string column is already present, don't add another one
      }
    }

    this.addFilter(stringColumn);
  }

  private async loadDatasets() {
    this.datasets = convertTableToVectors(await listData())
      .filter((d) => d.idtypes.indexOf(this.idType) >= 0 && isPossibleDataset(d));

    const matrixColumns = await Promise.all(this.datasets.filter((d) => d.desc.type === 'matrix').map(splitMatrixInVectors));
    this.datasets.push(...[].concat(...matrixColumns));

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
      this.fire(AFilter.EVENT_REMOVE_ME, data);
      this.updateURLHash();
    });


    this.filterManager.on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, (evt: any, data) => {
      this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, data);
    });

    this.propagate(this._filterManager, FilterManager.EVENT_FILTER_CHANGED);
  }

  private async addInitialFilters() {
    if (hash.has(this.idTypeHash)) {
      const toAdd = hash.getProp(this.idTypeHash)
        .split(SupportView.HASH_FILTER_DELIMITER)
        .map((name) => this.datasets.filter((d) => d.desc.id === name)[0])
        .filter((data) => data !== undefined);
      const datasets = [];
      for (const data of toAdd) {
        datasets.push(await this.addDataset(data));
      }
      this.fire(SupportView.EVENT_DATASETS_ADDED, datasets);
    }
  }

  private updateURLHash() {
    // add random id to hash
    hash.setProp(this.idTypeHash,
      this._filterManager.filters
        .map((d) => d.data.desc.id)
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

  sortByColumnHeader(sortColdata: { data: IDataType }) {
    this.filterManager.primarySortColumn(sortColdata);
  }

  sortFilterByHeader(sortColdata: { sortMethod: string, col: { data: IFilterAbleType } }) {
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

  remove(data: IDataType) {
    this.updateURLHash();
    if (this._filterManager.contains(<IFilterAbleType>data)) {
      this._filterManager.remove(null, <IFilterAbleType>data);
    }
  }

  removeIdTypeFromHash(idType: string) {
    hash.removeProp(idType);
  }

  private buildSelect2($parent: d3.Selection<any>) {
    (<HTMLElement>$parent.node()).insertAdjacentHTML('afterbegin', `<div class="selection">
      <select class="form-control">
        <option></option>
      </select>
    </div>`);

    const $select = $parent.select('select').property('selectedIndex', -1);

    this.addExplicitColors(this.datasets);

    const dataSetTree = convertToTree(this.datasets);

    const defaultOptions = {
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
      minimumInputLength: 0,
      ajax: {
        cache: false,
        dataType: 'json',
        delay: 0, // increase for 'real' ajax calls
        data: (params) => {
          return params; // params.term = search term
        },
        // fake ajax call with local data
        transport: (queryParams, success, error) => {
          success({
            items: filterTree(dataSetTree, queryParams.data.term)
          });
          return <any>{
            status: 0
          };
        },

        // parse the results into the format expected by Select2.
        processResults: (data, params) => {
          return {
            results: data.items,
            pagination: {
              more: false
            }
          };
        }
      }
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
  private async addExplicitColors(datasets: IDataType[]) {
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
            const base = color[j - 4];
            v.color = base[i % base.length];
          }
          if (v.label !== undefined) {
            v.label = v.name;
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


async function splitMatrixInVectors(matrix: IAnyMatrix) {
  const colNames = await matrix.cols();
  const cols = matrix.ncol;
  const r: IAnyVector[] = [];
  for (let i = 0; i < cols; ++i) {
    const v = matrix.slice(i);
    const anyDesc: any = v.desc;
    // hack the name to include the column label
    anyDesc.name = matrix.desc.name + '/' + colNames[i];
    anyDesc.origin = matrix;
    anyDesc.fqname = matrix.desc.fqname + '/' + colNames[i];
    r.push(v);
  }
  return r;
}

function convertToTree(datasets: IDataType[]) {
  // has a origin field, i.e. is derived from a matrix
  const isDerivedDataset = (dataset: IDataType) => !!(<any>dataset.desc).origin;
  const isDerivedGroup = (group: string) => group.endsWith('-d');
  //group by data type with special derived groups at the end
  const grouped = d3.nest<IDataType>()
    .key((d) => d.desc.type + (isDerivedDataset(d) ? '-d' : ''))
    .sortKeys((a, b) => {
      //derived groups to the end of the list
      const derivedA = isDerivedGroup(a);
      const derivedB = isDerivedGroup(b);
      if (derivedA === derivedB) {
        return a.localeCompare(b);
      }
      return derivedA ? +1 : -1;
    })
    .entries(datasets);

  return grouped.map((group) => {
    const isDervivedGroup = isDerivedGroup(group.key);
    const type = isDervivedGroup ? group.key.substring(0, group.key.length - 2) : group.key;
    const children = group.values.map((d) => ({
      id: d.desc.id,
      text: formatAttributeName(d.desc.name),
      dataType: d.desc.type,
      valueType: dataValueType(d),
      data: d
    }));
    return {
      text: (isDervivedGroup ? `Derived ${type}` : type),
      dataType: type,
      children,
      derived: isDervivedGroup
    };
  });
}


/**
 * filteres the given dataset tree to matching the query
 * @param datasetTree
 * @param query
 * @return {({}&{children: {text: string}[]}&{children: {text: string}[]})[]}
 */
function filterTree(datasetTree: { text: string; derived: boolean; children: { text: string }[] }[], query: string, maxTotalItems = 30, minItemsPerRegular = 5, minItemsPerDerived = 2) {
  function limit(group: string, arr: any[], maxItemsPerGroup = 5) {
    if (arr.length <= maxItemsPerGroup) {
      return arr;
    }
    const base = arr.slice(0, maxItemsPerGroup);
    base.push({
      id: group + '-more',
      disabled: true,
      text: `${arr.length - maxItemsPerGroup} more ...`
    });
    return base;
  }

  const filteredTree = datasetTree
    .map((parent) => {
      //create a copy with filtered children
      const children = !query ? parent.children : parent.children.filter((child) => child.text.toLowerCase().includes(query));
      //create a shallow copy
      return Object.assign({}, parent, {children});
    })
    .filter((d) => d.children.length > 0); //remove empty categories

  // total number of entries
  const total = filteredTree.reduce((total, act) => total + act.children.length, 0);
  if (total > maxTotalItems) {
    const derived = filteredTree.filter((d) => d.derived);
    const totalDerived = derived.reduce((total, act) => total + act.children.length, 0);
    const totalRegular = total - totalDerived;

    //if we have to hide something take it from the derived ones first
    const remainingPerDerived = Math.max(Math.ceil((maxTotalItems - (total - totalDerived)) / derived.length), minItemsPerDerived);
    derived.forEach((parent) => {
      parent.children = limit(parent.text, parent.children, remainingPerDerived);
    });

    if ((total - totalDerived) > maxTotalItems) {
      //need to cut also the regular ones
      filteredTree.forEach((parent) => {
        //distribute based on the number of items
        const ratio = parent.children.length / totalRegular;
        const maxItems = Math.max(minItemsPerRegular, Math.floor(maxTotalItems * ratio));
        parent.children = limit(parent.text, parent.children, maxItems);
      });
    }
  }
  return filteredTree;
}
