/**
 * Created by Samuel Gratzl on 25.04.2017.
 */

import {VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL, ICategoricalValueTypeDesc, INumberValueTypeDesc} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import Range1D from 'phovea_core/src/range/Range1D';
import createAccessor from './access';
import LineUp from 'lineupjs/src/lineup';
import Ranking, {ISortCriteria} from 'lineupjs/src/model/Ranking';
import {ITaggleDataType, ITaggleDataDescription} from './constant';

import ValueColumn from 'lineupjs/src/model/ValueColumn';
import Column from 'lineupjs/src/model/Column';
import {createSelectionDesc} from 'lineupjs/src/model';
import LocalDataProvider from 'lineupjs/src/provider/LocalDataProvider';
import {EventHandler, on as globalOn} from 'phovea_core/src/event';
import {SORT} from 'mothertable/src/SortHandler/SortHandler';
import AFilter from 'mothertable/src/filter/AFilter';
import ColumnManager from 'mothertable/src/column/ColumnManager';
import {EVENT_GLOBAL_REMOVE_DATA} from './constants';
import {AVectorFilter} from '../filter/AVectorFilter';
import {AVectorColumn} from '../column/AVectorColumn';
import MyRankColumn from './MyRankColumn';


function createDesc(vectorDesc: ITaggleDataDescription) {
  const desc: any = {
    type: 'string',
    label: vectorDesc.name,
    lazyLoaded: true
  };
  if (vectorDesc.type === 'vector') {
    switch (vectorDesc.value.type) {
      case VALUE_TYPE_REAL:
      case VALUE_TYPE_INT:
        const n = <INumberValueTypeDesc>vectorDesc.value;
        desc.type = 'number';
        desc.domain = n.range;
        break;
      case VALUE_TYPE_CATEGORICAL:
        const c = <ICategoricalValueTypeDesc>vectorDesc.value;
        desc.type = 'categorical';
        desc.categories = c.categories;
        break;
      default:
        break;
    }
  } else if (vectorDesc.type === 'matrix') {
    desc.type = 'multiValue';
    const n = <INumberValueTypeDesc>vectorDesc.value;
    desc.domain = n.range;
    desc.dataLength = vectorDesc.size[0];
  }
  const accessor = createAccessor(desc, (row) => row);
  return {accessor, desc};
}

export default class Renderer extends EventHandler {
  private readonly lineup: LineUp;
  private readonly provider: LocalDataProvider;
  private readonly providerRange: Range1D = Range1D.none();

  private readonly descriptions = new Map<ITaggleDataType, any>();

  constructor(readonly parent: HTMLElement) {
    super();
    this.provider = new LocalDataProvider([], [], {
      columnTypes: {
        'rank': MyRankColumn
      }
    });
    const r = this.provider.pushRanking();
    this.provider.push(r, createSelectionDesc());

    this.lineup = new LineUp(parent, this.provider, {
      renderingOptions: {
        histograms: true
      }
    });

    this.attachListeners();
  }

  private attachListeners() {
    globalOn(EVENT_GLOBAL_REMOVE_DATA, this.removeViaFilter.bind(this));

    this.provider.on(LocalDataProvider.EVENT_REMOVE_COLUMN, (column: Column) => {
      this.removeViaLineUp(column);
    });

    this.provider.getRankings().forEach((r) => {
      r.on(Ranking.EVENT_SORT_CRITERIA_CHANGED, (old: any, newValue: ISortCriteria) => {
        const sortMethod = newValue.asc ? SORT.asc : SORT.desc;
        const col = { data: getDataSet4Column(newValue.col) };
        // confused why 2 events???
        this.fire(AVectorColumn.EVENT_SORTBY_COLUMN_HEADER, col);
        this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, {sortMethod, col});
      });
    });
  }

  private removeViaFilter(evt: any, col: ITaggleDataType) {
    const columns = this.columns;
    const column = columns.find((d) => d.data === col);
    if (column) {
      column.column.removeMe();
    }
  }

  private removeViaLineUp(column: Column) {
    const data = getDataSet4Column(column);
    this.fire(ColumnManager.EVENT_DATA_REMOVED, data);

  }

  async push(data: ITaggleDataType) {
    const ranking = this.provider.getLastRanking();

    if (this.descriptions.has(data)) {
      // TODO add same column multiple times
      return {data};
    }

    const {desc, accessor} = createDesc(data.desc);
    desc._dataset = data;
    this.provider.pushDesc(desc);
    this.descriptions.set(data, desc);

    // add to visible lineup
    const column = <ValueColumn<any>>this.provider.push(ranking, desc);

    const ids = await data.ids();
    this.initLineUpIds(ids);

    const values = await data.data();
    const lookup = new Map<number, any>();
    ids.dim(0).forEach((id, index) => {
      lookup.set(id, values[index]);
    });
    accessor.scores = lookup;
    column.setLoaded(true);

    return <any>{data};
  }

  private initLineUpIds(ids: Range) {
    const missing = ids.dim(0).without(this.providerRange);
    if (missing.isNone) {
      return;
    }
    const full = this.providerRange.union(missing);
    const indices = full.asList();
    this.provider.setData(indices);
    this.lineup.update();
  }

  destroy() {
    this.lineup.destroy();
  }

  relayout() {
    this.lineup.update();
  }

  updateSortByIcons(sortData: {col: { data: ITaggleDataType}, sortMethod: string}): any {
    const columns = this.columns;
    const column = columns.find((c) => c.data === sortData.col.data);
    column.column.sortByMe(sortData.sortMethod === SORT.asc);
    return column;
  }


  mapFiltersAndSort(activeFilters: { data: ITaggleDataType}[]) {
    const sortCriteria = activeFilters[0].data;
    this.updateSortByIcons({col: {data: sortCriteria}, sortMethod: SORT.desc});
    console.log(activeFilters);
  }

  updateColumns() {
    this.lineup.update();
  }

  filterData(idRange: Range) {
    // set the filter within the custom rank column
    this.provider.getRankings().forEach((r) => {
      const myRank: MyRankColumn = <MyRankColumn>r.children.find((c) => c.desc.type === 'rank');
      if (myRank) {
        myRank.setFilter(idRange.dim(0));
      }
    });
  }

  get length() {
    return this.provider.getLastRanking().length;
  }

  get columns() {
    const rankings = this.provider.getRankings();
    const datasets = rankings.map((r) => r.flatColumns.map((column) => new LineUpAdapter(column)));
    return <LineUpAdapter[]>[].concat(...datasets).filter((d) => d.data);
  }
}

function getDataSet4Column(column: Column) {
  return (<any>column.desc)._dataset;
}

export class LineUpAdapter {
  constructor(public readonly column: Column) {

  }
  get data() {
    return getDataSet4Column(this.column);
  }

  updateSortIcon(sortMethod: 'asc'|'desc') {
    this.column.sortByMe(sortMethod === 'asc');
  }
}
