/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AFilter from './AFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {INumericalMatrix} from 'phovea_core/src/matrix';


export default class MatrixFilter extends AFilter<number, INumericalMatrix> {
  readonly node: HTMLElement;

  constructor(data: INumericalMatrix, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  private build(parent: HTMLElement) {
    const node = <HTMLDivElement><any>parent.ownerDocument.createElement('div');

    return node;
  }

  isFiltered() {
    return false;
  }

  filter(v: number) {
    return true;
  }
}
