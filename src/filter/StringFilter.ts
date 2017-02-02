/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter, IStringVector} from './AVectorFilter';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

export default class StringFilter extends AVectorFilter<string, IStringVector> {
  readonly node: HTMLElement;

  constructor(data: IStringVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);


    this.generateLabel(node);
    this.generateSearchInput(node);

    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //   this.triggerFilterChanged();
    // });

    return node;
  }


  private generateLabel(node) {
    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    labelNode.text(`Label: ${this.data.desc.name}`);
  }


  private async generateSearchInput(node) {
    const textSearch = (<any>d3).select(node).append('input', 'text').classed('textSearch', true);
    textSearch.on('keyup', function (d) {
      const filterType = this.value;
    });

  }


  async filter(current: Range1D) {
    // TODO
    return current;
  }
}
