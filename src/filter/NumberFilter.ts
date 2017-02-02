/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter} from './AVectorFilter';
import {INumericalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

export default class NumberFilter extends AVectorFilter<number, INumericalVector> {
  readonly node: HTMLElement;

  constructor(data: INumericalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    this.generateLabel(node);

    // node.innerHTML = `<button>TODO for ${this.data.desc.name}</button>`;
    // console.log('hi');
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //
    //   this.triggerFilterChanged();
    // });

    return node;
  }

  private generateLabel(node) {
    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    labelNode.text(`Label: ${this.data.desc.name}`);
  }

  async filter(current: Range1D) {
    // TODO
    return current;
  }
}
