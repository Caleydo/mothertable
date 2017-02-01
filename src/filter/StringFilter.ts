/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter, IStringVector} from './AVectorFilter';
import {Range1D} from 'phovea_core/src/range';

export default class StringFilter extends AVectorFilter<string, IStringVector> {
  readonly node: HTMLElement;

  constructor(data: IStringVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    node.innerHTML = `<strong>TODO for ${this.data.desc.name}</strong>`;

    return node;
  }
}
