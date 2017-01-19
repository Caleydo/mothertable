import AFilter from './AFilter';
import {INumericalVector} from 'phovea_core/src/vector';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */


export default class NumberFilter extends AFilter<number, INumericalVector> {
  readonly node: HTMLElement;

  constructor(data: INumericalVector, parent: HTMLElement) {
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
