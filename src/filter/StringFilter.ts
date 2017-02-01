/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter, IStringVector} from './AVectorFilter';

export default class StringFilter extends AVectorFilter<string, IStringVector> {
  readonly node: HTMLElement;

  constructor(data: IStringVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    // TODO

    return node;
  }
}
