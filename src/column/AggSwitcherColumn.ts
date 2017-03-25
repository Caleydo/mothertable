/**
 * Created by Holger Stitz on 21.03.2017.
 */

import * as d3 from 'd3';
import {EOrientation, default as AColumn} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';
import {EAggregationType, default as VisManager} from './VisManager';


export default class AggSwitcherColumn extends AColumn<any, IDataType> {

  static readonly EVENT_GROUP_AGG_CHANGED = 'groupAggChanged';

  minWidth: number = 25;
  maxWidth: number = 25;

  private $main:d3.Selection<any>;

  constructor(data: any, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
  }

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    const $node = $parent.append('li')
      .attr('class', 'column column-hor nodrag aggSwitcher')
      .style('max-width', this.maxWidth + 'px')
      .style('min-width', this.minWidth + 'px');

    const $header = $node.append('header')
      .classed('columnHeader', true);

    $header.append('div').classed('labelName', true).html('&nbsp;');
    $header.append('div').classed('toolbar', true).html('&nbsp;');

    this.$main = $node.append('main');

    return $node;
  }

  updateSwitcherBlocks(heights: number[]) {
    if(heights.length !== VisManager.modePerGroup.length) {
      VisManager.modePerGroup = heights.map((d) => EAggregationType.AUTOMATIC);
    }

    const $blocks = this.$node.select(':scope > main')
      .selectAll('div')
      .data(heights);

    const $enter = $blocks.enter().append('div').classed('toolbar', true);

    $enter.append('a')
      .attr('href', '#')
      .attr('title', 'Switch to aggregated visualization')
      .attr('class', (d, i) => (VisManager.modePerGroup[i] === EAggregationType.AGGREGATED) ? 'active': null)
      .html(`<i class="fa fa-window-minimize fa-fw fa-rotate-90" aria-hidden="true"></i>`)
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        const curr = <HTMLElement>(<MouseEvent>d3.event).currentTarget;
        d3.select(curr.parentNode).selectAll('a').classed('active', false);
        d3.select(curr).classed('active', true);

        VisManager.modePerGroup[i] = EAggregationType.AGGREGATED;
        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, VisManager.modePerGroup[i], VisManager.modePerGroup);
      });

    $enter.append('a')
      .attr('href', '#')
      .attr('title', 'Switch to unaggregated visualization')
      .attr('class', (d, i) => (VisManager.modePerGroup[i] === EAggregationType.UNAGGREGATED) ? 'active': null)
      .html(`<i class="fa fa-ellipsis-v fa-fw" aria-hidden="true"></i>`)
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        const curr = <HTMLElement>(<MouseEvent>d3.event).currentTarget;
        d3.select(curr.parentNode).selectAll('a').classed('active', false);
        d3.select(curr).classed('active', true);

        VisManager.modePerGroup[i] = EAggregationType.UNAGGREGATED;
        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, VisManager.modePerGroup[i], VisManager.modePerGroup);
      });

    $enter.append('a')
      .attr('href', '#')
      .attr('title', 'Switch to automatic mode')
      .attr('class', (d, i) => (VisManager.modePerGroup[i] === EAggregationType.AUTOMATIC) ? 'active': null)
      .html(`<i class="fa fa-magic fa-fw" aria-hidden="true"></i>`)
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        const curr = <HTMLElement>(<MouseEvent>d3.event).currentTarget;
        d3.select(curr.parentNode).selectAll('a').classed('active', false);
        d3.select(curr).classed('active', true);

        VisManager.modePerGroup[i] = EAggregationType.AUTOMATIC;
        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, VisManager.modePerGroup[i], VisManager.modePerGroup);
      });

    $blocks.style('height', (d) => d + 'px');

    $blocks.exit().remove();
  }
}
