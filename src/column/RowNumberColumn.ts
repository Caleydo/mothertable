import AColumn, {EOrientation} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';
import {IMotherTableType} from './ColumnManager';

export default class RowNumberColumn extends AColumn<any, IDataType> {

  readonly minWidth: number = 10;
  private readonly dataList: number[];
  private $div: d3.Selection<any>;
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

    //todo find a better way to calculate height (use the height of the aggregator column header
    $header.append('div').classed('labelName', true).html('&nbsp;');
    $header.append('div').classed('toolbar', true).html('&nbsp;');
    $header.append('div').classed('axis', true).html('&nbsp;');

    this.buildInitialRows();
    return this.$node;
  }

  buildInitialRows() {
    if(!this.$node) {
      return;
    }
    this.$div = this.$node.append('main')
      .append('div')
      .classed('phovea-list', true)
      .classed('taggle-vis-list', true);
  }

  updateRowBlocks(heights: number[]) {
    const $blocks = this.$node.select('main > div')
    $blocks
      .style('height', heights[0] + 'px')
      .style('min-height', heights[0] + 'px');

      this.$div.selectAll('div')
      .data(this.dataList)
      .enter()
      .append('div')
      .text(function(d){return d;});
  }

  updateRowNumberColumn(size : number[]) {
    //TODO don't check statically for size[0] or check if it holds
    if(size[0] + 1 === this.dataList.length) {
      return;
    }
    for (let i = 0; i <= size[0]; i++) {
      this.dataList.push(i);
    }
  }
}
