/**
 * Created by Holger Stitz on 21.03.2017.
 */

import * as d3 from 'd3';
import {EOrientation, default as AColumn} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';
import {AggMode} from './VisManager';

export default class AggSwitcherColumn extends AColumn<any, IDataType> {

  static readonly EVENT_GROUP_AGG_CHANGED = 'groupAggChanged';

  minWidth: number = 40;
  maxWidth: number = 40;

  private $main:d3.Selection<any>;

  static modePerGroup:AggMode[] = [];

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
    //todo replace by inheritace from parent/children rows (code in AVectorColumn
    if(heights.length !== AggSwitcherColumn.modePerGroup.length) {
      AggSwitcherColumn.modePerGroup = heights.map((d) => AggMode.Automatic);
    }

    const $blocks = this.$node.select(':scope > main')
      .selectAll('div')
      .data(heights);

    const $enter = $blocks.enter().append('div');

    $enter.append('a')
      .attr('href', '#')
      .text('Agg')
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        AggSwitcherColumn.modePerGroup[i] = AggMode.Aggregated;
        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, AggSwitcherColumn.modePerGroup[i], AggSwitcherColumn.modePerGroup);
      });

    $enter.append('a')
      .attr('href', '#')
      .text('Unagg')
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        AggSwitcherColumn.modePerGroup[i] = AggMode.Unaggregated;
        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, AggSwitcherColumn.modePerGroup[i], AggSwitcherColumn.modePerGroup);
      });

    $enter.append('a')
      .attr('href', '#')
      .text('Auto')
      .on('click', (d,i) => {
        const e = <Event>d3.event;
        e.preventDefault();
        e.stopPropagation();

        AggSwitcherColumn.modePerGroup[i] = AggMode.Automatic;
        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, i, AggSwitcherColumn.modePerGroup[i], AggSwitcherColumn.modePerGroup);
      });

    $blocks
      .attr('class', (d, i) => {
        switch(AggSwitcherColumn.modePerGroup[i]) {
          case AggMode.Aggregated:
            return 'agg';
          case AggMode.Unaggregated:
            return 'unagg';
          case AggMode.Automatic:
            return 'auto';
        }
      })
      .style('height', (d) => d + 'px');

    $blocks.exit().remove();
  }
}
