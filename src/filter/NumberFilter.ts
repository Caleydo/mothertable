/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';

export default class NumberFilter extends AVectorFilter<number, INumericalVector> {
  readonly node: HTMLElement;

  constructor(data: INumericalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    node.innerHTML = `<button>TODO for ${this.data.desc.name}</button>`;
    (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
      this.triggerFilterChanged();
    });

    return node;
  }

  async filter(current: Range1D) {
    // TODO
    return current;
  }
}
