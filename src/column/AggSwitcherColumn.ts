/**
 * Created by Holger Stitz on 21.03.2017.
 */

import * as d3 from 'd3';
import {EOrientation, default as AColumn} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';
import {EAggregationType, default as VisManager} from './VisManager';

interface IAggSwitcherType {
  selectByUser: EAggregationType;
  selectByAutomatic: EAggregationType;
  height: number;
}

export default class AggSwitcherColumn extends AColumn<any, IDataType> {

  static readonly EVENT_GROUP_AGG_CHANGED = 'groupAggChanged';

  minWidth: number = 25;
  maxWidth: number = 25;

  private $main:d3.Selection<any>;

  private aggTypesPerGroup:IAggSwitcherType[] = [];

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
    if(heights.length !== this.aggTypesPerGroup.length) {
      this.aggTypesPerGroup = heights.map((d):IAggSwitcherType => {
        return {
          selectByUser: EAggregationType.AUTOMATIC,
          selectByAutomatic: EAggregationType.AUTOMATIC,
          height: d
        };
      });
      VisManager.modePerGroup = this.aggTypesPerGroup.map((d) => d.selectByAutomatic);
    }

    this.aggTypesPerGroup.forEach((d, i) => {
      d.height = heights[i];
    });

    const $blocks = this.$node.select(':scope > main')
      .selectAll('div')
      .data(this.aggTypesPerGroup);

    const $enter = $blocks.enter().append('div').classed('toolbar', true);

    // Note: appending order matters when using :nth-child in the setAggregationType()
    $enter.append('a')
      .attr('href', '#')
      .attr('title', 'Switch to aggregated visualization')
      .attr('class', (d, i) => (d.selectByUser === EAggregationType.AGGREGATED || d.selectByAutomatic === EAggregationType.AGGREGATED) ? 'active': null)
      .html(`<i class="fa fa-window-minimize fa-fw fa-rotate-90" aria-hidden="true"></i>`)
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        const curr = <HTMLElement>(<MouseEvent>d3.event).currentTarget;
        d3.select(curr.parentNode).selectAll('a').classed('active', false);
        d3.select(curr).classed('active', true);

        VisManager.modePerGroup[i] = EAggregationType.AGGREGATED;
        d.selectByUser = EAggregationType.AGGREGATED;
        d.selectByAutomatic = EAggregationType.AGGREGATED;

        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, VisManager.modePerGroup[i], VisManager.modePerGroup);
      });

    $enter.append('a')
      .attr('href', '#')
      .attr('title', 'Switch to unaggregated visualization')
      .attr('class', (d, i) => (d.selectByUser === EAggregationType.UNAGGREGATED || d.selectByAutomatic === EAggregationType.UNAGGREGATED) ? 'active': null)
      .html(`<i class="fa fa-ellipsis-v fa-fw" aria-hidden="true"></i>`)
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        const curr = <HTMLElement>(<MouseEvent>d3.event).currentTarget;
        d3.select(curr.parentNode).selectAll('a').classed('active', false);
        d3.select(curr).classed('active', true);

        VisManager.modePerGroup[i] = EAggregationType.UNAGGREGATED;
        d.selectByUser = EAggregationType.UNAGGREGATED;
        d.selectByAutomatic = EAggregationType.UNAGGREGATED;

        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, VisManager.modePerGroup[i], VisManager.modePerGroup);
      });

    $enter.append('a')
      .attr('href', '#')
      .attr('title', 'Switch to automatic mode')
      .attr('class', (d, i) => (d.selectByUser === EAggregationType.AUTOMATIC || d.selectByAutomatic === EAggregationType.AUTOMATIC) ? 'active': null)
      .html(`<i class="fa fa-magic fa-fw" aria-hidden="true"></i>`)
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        const curr = <HTMLElement>(<MouseEvent>d3.event).currentTarget;
        d3.select(curr.parentNode).selectAll('a').classed('active', false);
        d3.select(curr).classed('active', true);

        VisManager.modePerGroup[i] = EAggregationType.AUTOMATIC;
        d.selectByUser = EAggregationType.AUTOMATIC;
        d.selectByAutomatic = EAggregationType.AUTOMATIC;

        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, VisManager.modePerGroup[i], VisManager.modePerGroup);
      });

    $blocks.style('height', (d) => d.height + 'px');

    $blocks.exit().remove();
  }

  setAggregationType(rowIndex:number, aggregationType:EAggregationType) {
    if(!this.aggTypesPerGroup[rowIndex]) {
      this.aggTypesPerGroup[rowIndex] = {
        selectByUser: EAggregationType.AUTOMATIC,
        selectByAutomatic: aggregationType,
        height: 0
      };
    } else {
      this.aggTypesPerGroup[rowIndex].selectByAutomatic = aggregationType;
    }

    const $toolbar = this.$node.select(':scope > main')
      .selectAll(`.toolbar:nth-child(${rowIndex+1})`); // +1 because nth-child starts counting from 1

    // deselect everyting
    $toolbar.selectAll('a')
      .classed('active', false);

    // highlight automatic mode
    $toolbar.selectAll(`a:nth-child(${this.aggTypesPerGroup[rowIndex].selectByAutomatic+1})`)
      .classed('active', true);

    // highlight user mode
    $toolbar.selectAll(`a:nth-child(${this.aggTypesPerGroup[rowIndex].selectByUser+1})`)
      .classed('active', true);
  }
}
