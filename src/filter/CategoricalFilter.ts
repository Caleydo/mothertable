import AFilter from 'mothertable/src/filter/AFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class CategoricalFilter extends AFilter<string, ICategoricalVector> {
  readonly node: HTMLElement;

  constructor(data: ICategoricalVector, parent: HTMLElement) {
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

  filter(v: string) {
    return true;
  }
}
