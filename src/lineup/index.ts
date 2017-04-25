/**
 * Created by Samuel Gratzl on 25.04.2017.
 */

import {VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL, ICategoricalValueTypeDesc, INumberValueTypeDesc} from 'phovea_core/src/datatype';
import Range from 'phovea_core/src/range/Range';
import Range1D from 'phovea_core/src/range/Range1D';
import createAccessor, {ScoreAccessorProxy} from './access';
import LineUp from 'lineupjs/src/lineup';
import {ITaggleDataType, ITaggleDataDescription} from './constant';

import ValueColumn from 'lineupjs/src/model/ValueColumn';
import {createSelectionDesc} from 'lineupjs/src/model';
import LocalDataProvider from 'lineupjs/src/provider/LocalDataProvider';
import {EventHandler} from 'phovea_core/src/event';


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

  constructor(readonly parent: HTMLElement) {
    super();
    this.provider = new LocalDataProvider([], []);
    const r = this.provider.pushRanking();
    this.provider.push(r, createSelectionDesc());

    this.lineup = new LineUp(parent, this.provider, {
      renderingOptions: {
        histograms: true
      }
    });
  }

  async push(data: ITaggleDataType) {
    const {desc, accessor} = createDesc(data.desc);
    this.provider.pushDesc(desc);
    const ranking = this.provider.getLastRanking();
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

  updateSortByIcons(data: ITaggleDataType): any {
    // TODO
    return null;
  }


  mapFiltersAndSort(data: any[]) {
    // TODO
  }

  updateColumns() {
    this.lineup.update();
  }

  filterData(filter: Range) {
    // TODO
  }

  get length() {
    return this.provider.getLastRanking().length;
  }

  get columns() {
    return [];
  }
}
