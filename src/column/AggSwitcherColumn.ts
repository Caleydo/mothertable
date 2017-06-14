/**
 * Created by Holger Stitz on 21.03.2017.
 */

import * as d3 from 'd3';
import {EOrientation, default as AColumn} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';
import {EAggregationType, default as VisManager} from './VisManager';

interface IAggSwitcherType {
  mode: EAggregationType;
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

    $node.html(`
        <aside></aside>
        <header class="columnHeader">
          <div class="toolbar">
            <div class="labelName">&nbsp;</div>
            <div class="axis">&nbsp;</div>
          </div>
        </header>`);
    this.$main = $node.append('main');
    return $node;
  }

  updateSwitcherBlocks(heights: number[]) {
    //ensure right size and initialize
    if(heights.length !== this.aggTypesPerGroup.length) {
      this.aggTypesPerGroup = heights.map((d : number):IAggSwitcherType => {
        return {
          mode: EAggregationType.UNAGGREGATED, //AUTOMATIC
          height: d
        };
      });
      VisManager.modePerGroup = this.aggTypesPerGroup.map((d) => d.mode);
    }

    this.aggTypesPerGroup.forEach((d, i) => {
      d.height = heights[i];
    });

    const $blocks = this.$node.select(':scope > main')
      .selectAll('div')
      .data(this.aggTypesPerGroup);

    $blocks.enter().append('div').classed('toolbar', true);

    const modes = [
      {
        type: EAggregationType.AGGREGATED,
        label: 'Switch to aggregated visualization',
        icon: 'fa-window-minimize fa-rotate-90'
      },
      {
        type: EAggregationType.UNAGGREGATED,
        label: 'Switch to unaggregated visualization',
        icon: 'fa-ellipsis-v'
      },
      {
        type: EAggregationType.AUTOMATIC,
        label: 'Switch to automatic mode',
        icon: 'fa-magic'
      }
    ];
    // nested binding
    const $toolbar = $blocks.selectAll('a').data(modes);
    $toolbar.enter().append('a')
      .attr('href', '#')
      .on('click', (d, i, j) => {
        const e = <MouseEvent>d3.event;
        e.preventDefault();
        e.stopPropagation();
        // toggle others and activate myself
        $toolbar.classed('active', (k) => k === d);

        VisManager.modePerGroup[j] = d.type;

        const parent = this.aggTypesPerGroup[j];
        parent.mode = d.type;

        this.fire(AggSwitcherColumn.EVENT_GROUP_AGG_CHANGED, j, d.type, VisManager.modePerGroup);
      });
    $toolbar
      .attr('title', (d) => d.label)
      .classed('active', (d, i, j) => {
        const parent = this.aggTypesPerGroup[j];
        return parent.mode === d.type;
      })
      .html((d) => `<i class="fa ${d.icon} fa-fw" aria-hidden="true"></i>`);

    $toolbar.exit().remove();

    $blocks
      .style('min-height', (d) => d.height + 'px')
      .style('height', (d) => d.height + 'px');

    $blocks.exit().remove();
  }

  setAggregationType(rowIndex:number, aggregationType:EAggregationType) {
    if(!this.aggTypesPerGroup[rowIndex]) {
      this.aggTypesPerGroup[rowIndex] = {
        mode: EAggregationType.UNAGGREGATED, //AUTOMATIC
        height: 0
      };
    }
    const entry = this.aggTypesPerGroup[rowIndex];
    entry.mode = aggregationType;

    const $toolbar = this.$node.select(':scope > main')
      .selectAll(`.toolbar:nth-child(${rowIndex+1})`); // +1 because nth-child starts counting from 1

    //activate the proper toggle button
    $toolbar.selectAll<{type: EAggregationType}>('a')
      .classed('active', (d) => {
        //active when one of these criteria is valid
        return entry.mode === d.type;
      });
  }
}
