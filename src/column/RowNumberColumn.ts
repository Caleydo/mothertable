import AColumn, {EOrientation} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';
import {IMotherTableType} from './ColumnManager';
import VisManager, {EAggregationType} from './VisManager';

interface IAggSwitcherType {
  height: number;
  groupLength: number[];
  rowHeight: number;
  aggregationType: EAggregationType;
}

export default class RowNumberColumn extends AColumn<any, IDataType> {

  readonly minWidth: number = 10;
  private $main: d3.Selection<any>;
  private aggTypesPerGroup:IAggSwitcherType[] = [];
  private readonly minRowHeight = 18;

  constructor(data: any, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
  }

  protected buildVertical($parent: d3.Selection<any>): d3.Selection<any> {
    this.$node = $parent.append('li')
      .attr('class', 'column column-hor nodrag rowNumberColumn')
      .style('min-width', this.minWidth + 'px');

    this.$node.html(`
        <aside></aside>
        <header class="columnHeader">
          <div class="toolbar">
            <div class="labelName">&nbsp;</div>
            <div class="axis">&nbsp;</div>
          </div>
        </header>`);
    this.init();
    return this.$node;
  }

  init() {
    if(!this.$node) {
      return;
    }
    this.$main = this.$node.append('main');
  }

  updateNumberedBlocks(heights: number[], groupLength: number[][]) {
    console.assert(heights.length === groupLength.length);


    // create new aggregation type object for each group
    if(heights.length !== this.aggTypesPerGroup.length) {
      //ensure right length
      this.aggTypesPerGroup = heights.map((d):IAggSwitcherType => {
        return {
          height: d,
          groupLength: [],
          rowHeight: 0,
          aggregationType: EAggregationType.UNAGGREGATED
        };
      });
    }

    // initialize each group type
    // use VisManager.modePerGroup to know whether or not the group is aggregated
    this.aggTypesPerGroup.forEach((d, i) => {
      d.height = heights[i];
      d.groupLength = groupLength[i];
      d.rowHeight = d.height / d.groupLength.length;
      d.aggregationType = VisManager.modePerGroup[i];
    });

    const $blocks = this.$main
      .selectAll('main > div')
      .data(this.aggTypesPerGroup);

     $blocks
      .enter()
      .append('div')
      .classed('phovea-list', true)
      .classed('taggle-vis-list', true);

    // if the current row height is too small to draw number labels or the row is aggregated
    // then set the aggregated CSS class
    // else draw each row label separately
    $blocks
      .classed('aggregated', (d) => d.rowHeight < this.minRowHeight || d.aggregationType === EAggregationType.AGGREGATED)
      .style('min-height', (d) => d.height + 'px')
      .style('height', (d) => d.height + 'px');

    const $counter = $blocks.selectAll('div')
      .data((d) => {
        if (d.rowHeight < this.minRowHeight || d.aggregationType === EAggregationType.AGGREGATED) {
          // just the corners
          return [d.groupLength[0], d.groupLength[d.groupLength.length - 1]];
        }
        return d.groupLength;
      });


    $counter.enter().append('div');

    $counter.text(String);

    $counter.exit().remove();

    $blocks.exit().remove();
  }
}
