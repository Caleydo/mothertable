import {AVectorColumn} from './AVectorColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {INumericalVector} from 'phovea_core/src/vector';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class NumberColumn extends AVectorColumn<number, INumericalVector> {
  readonly columnNode: HTMLElement;
  readonly filterNode: HTMLElement;

  constructor(data: INumericalVector, columnParent: HTMLElement, filterParent: HTMLElement) {
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

  update(range: CompositeRange1D) {
    // TODO
  }
}