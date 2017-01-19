import AColumn from './AColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {INumericalMatrix} from 'phovea_core/src/matrix';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  readonly columnNode: HTMLElement;
  readonly filterNode: HTMLElement;

  constructor(data: INumericalMatrix, columnParent: HTMLElement, filterParent: HTMLElement) {
    super(data);
    this.columnNode = this.buildColumn(columnParent);
    this.filterNode = this.buildFilter(filterParent);
  }

  private buildColumn(parent: HTMLElement) {
    const node = <HTMLDivElement><any>parent.ownerDocument.createElement('div');
    parent.appendChild(node);
    return node;
  }

  private buildFilter(parent: HTMLElement) {
    const node = <HTMLDivElement><any>parent.ownerDocument.createElement('div');
    parent.appendChild(node);
    return node;
  }

  isFiltered() {
    return false;
  }

  filter(v: number) {
    return true;
  }

  sortAndFilter(idRange: CompositeRange1D): Promise<CompositeRange1D> {
    if (!this.isFiltered() || idRange.isNone) {
      return Promise.resolve(idRange);
    }
    return Promise.reject('not implemented');
    //const subset = range.isAll ? this.data : this.data.view(rlist(range));
    //return subset.filter(this.filter.bind(this))
    //  .then((filtered) => filtered.)
    //  .then((idRange))
  }

  update(range: CompositeRange1D) {
    // TODO
  }
}
