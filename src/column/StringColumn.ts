import {AVectorColumn, IStringVector} from './AVectorColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class StringColumn extends AVectorColumn<string, IStringVector> {
  readonly columnNode: HTMLElement;
  readonly filterNode: HTMLElement;

  constructor(data: IStringVector, columnParent: HTMLElement, filterParent: HTMLElement) {
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

  filter(v: string) {
    return true;
  }

  update(range: CompositeRange1D) {
    // TODO
  }
}
