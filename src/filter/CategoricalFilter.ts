/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly node: HTMLElement;

  constructor(data: ICategoricalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);

    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //   this.triggerFilterChanged();
    // });

    this.generateLabel(node);
    this.generateCategories(node);

    return node;
  }


  private generateLabel(node) {

    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    labelNode.text(`Label: ${this.data.desc.name}`);
  }


  private generateCategories(node) {

    console.log(this.data)

    const catEntries = d3.select(node).append('div').classed('catentries', true)
      .style('display', 'flex')
      .style('align-items', 'flex-end');
  }


  async filter(current: Range1D) {
    // TODO
    return current;
  }
}
