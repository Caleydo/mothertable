/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import {AVectorFilter, IStringVector} from './AVectorFilter';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

export default class StringFilter extends AVectorFilter<string, IStringVector> {
  readonly node: HTMLElement;
  private _textSearch: string;

  constructor(data: IStringVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
    this._textSearch = null;
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);


    this.generateLabel(node);
    this.generateSearchInput(node);


    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //   console.log(this.data)
    //   this.triggerFilterChanged();
    // });

    return node;
  }

  private generateTooltip(node) {
    const tooltipDiv = d3.select(node).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    return tooltipDiv;
  }

  private generateLabel(node: HTMLElement) {
    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    let name = this.data.desc.name;
    if (name.length > 6) {
      name = name.slice(0, 6) + '..';
    }
    const toolTip = (this.generateTooltip(node));
    const fullName = this.data.desc.name;
    labelNode.text(`${name.substring(0, 1).toUpperCase() + name.substring(1)}`)
      .on('mouseover', function (d, i) {
        toolTip.transition()
          .duration(200)
          .style('opacity', 1);
        toolTip.html(`${fullName}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 10) + 'px');
      })
      .on('mouseout', function (d) {
        toolTip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  }


  private async generateSearchInput(node: HTMLElement) {
    const that = this;
    const textSearch = (<any>d3).select(node).append('input', 'text').classed('textSearch', true);
    textSearch.on('keyup', function (d) {
      that._textSearch = this.value;
      that.triggerFilterChanged();
    });

  }


  async filter(current: Range1D) {

    const vectorView = await(<any>this.data).filter(stringPattern.bind(this, this._textSearch));
    const filteredRange = await vectorView.ids();
    const rangeIntersected = current.intersect(filteredRange);
    // console.log('r=', (<any>rangeIntersected).dim(0).asList(), 'f=', (<any>filteredRange).dim(0).asList());
    return rangeIntersected;
  }
}

function stringPattern(stringFilter, value, index) {
  if (stringFilter === null) {
    return value;
  }

  const re = new RegExp(`${stringFilter}`, 'gi');
  if (value.match(re) === null) {

    return;

  } else {

    return value;
  }


}
