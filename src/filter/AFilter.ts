/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import {EventHandler} from 'phovea_core/src/event';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';


abstract class AFilter<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';

  abstract readonly node: HTMLElement;
  activeFilter: boolean;

  constructor(public readonly data: DATATYPE) {
    super();
    this.activeFilter = false;
  }

  get idtype() {
    return this.data.idtypes[0];
  }

  protected build(parent: HTMLElement) {
    return parent;
  }


  async filter(current: Range1D) {
    return current;
  }


  protected generateTooltip(node: HTMLElement) {
    const tooltipDiv = d3.select(node).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    return tooltipDiv;
  }

  protected generateLabel(node: HTMLElement, labelname) {
    d3.select(node).select('header')
      .append('h2')
      .classed('filterlabel', true)
      .text(labelname);
  }

  protected triggerFilterChanged() {
    this.fire(AFilter.EVENT_FILTER_CHANGED, this);

  }

  protected checkFilterApplied(fullRange: number, vectorViewRange: number) {
    return (fullRange !== vectorViewRange);
  }


}

export default AFilter;
