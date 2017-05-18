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
  private readonly dataList: number[];
  private $main: d3.Selection<any>;
  private aggTypesPerGroup:IAggSwitcherType[] = [];
  private readonly minRowHeight = 18;

  constructor(data: any, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
    this.dataList = [];
  }

  protected buildVertical($parent: d3.Selection<any>): d3.Selection<any> {
    this.$node = $parent.append('li')
      .attr('class', 'column column-hor nodrag rowNumberColumn')
      .style('min-width', this.minWidth + 'px');

    this.$node.append('aside');

    const $header = this.$node.append('header')
      .classed('columnHeader', true);

    $header.append('div').classed('labelName', true).html('&nbsp;');
    $header.append('div').classed('toolbar', true).html('&nbsp;');
    $header.append('div').classed('axis', true).html('&nbsp;');

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
      this.aggTypesPerGroup = heights.map((d):IAggSwitcherType => {
        return {
          height: d,
          groupLength: [],
          rowHeight: 0,
          aggregationType: EAggregationType.UNAGGREGATED
        };
      });
    }

    this.aggTypesPerGroup.forEach((d, i) => {
      d.height = heights[i];
      d.groupLength = groupLength[i];
      d.rowHeight = d.height / d.groupLength.length;
      d.aggregationType = VisManager.modePerGroup[i];
    });

    const $blocks = this.$main
      .selectAll('main > div')
      .data(this.aggTypesPerGroup);

    const $enter = $blocks
      .enter()
      .append('div')
      .classed('phovea-list', true)
      .classed('taggle-vis-list', true);

    $blocks
      .classed('aggregated', (d) => d.rowHeight < this.minRowHeight || d.aggregationType === EAggregationType.AGGREGATED)
      .style('min-height', (d) => d.height + 'px')
      .style('height', (d) => d.height + 'px');

    const $counter = $blocks.selectAll('div')
      .data((d) => {
      if(d.rowHeight < this.minRowHeight || d.aggregationType === EAggregationType.AGGREGATED) {
        return [d.groupLength[0], d.groupLength[d.groupLength.length - 1]];
      }
      return d.groupLength;
    });


    $counter.enter().append('div');

    $counter.text((d) => {return d;});

    $counter.exit().remove();

    $blocks.exit().remove();
  }
}
