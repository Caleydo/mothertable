import AColumn, {EOrientation} from './AColumn';
import {IDataType} from 'phovea_core/src/datatype';

export default class RowNumberColumn extends AColumn<any, IDataType> {

  readonly minWidth: number = 10;
  width: number = 30;
  constructor(data: any, orientation: EOrientation, $parent: d3.Selection<any>) {
    super(data, orientation);
    this.$node = this.build($parent);
  }

  protected buildVertical($parent: d3.Selection<any>): d3.Selection<any> {
    this.$node = $parent.append('li')
      .attr('class', 'column column-hor nodrag rowNumberColumn')
      .style('max-width', this.width + 'px')
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
    const $div = this.$node.append('main')
      .append('div')
      .classed('phovea-list', true)
      .classed('taggle-vis-list', true);

    const list = [3, 6, 78, 200, 3, 6, 78, 200, 3, 6, 78, 200];
    $div.selectAll('div')
      .data(list)
      .enter()
      .append('div')
      .text(function(d){return d;});
  }

  updateRowBlocks(heights: number[]) {
    const $blocks = this.$node.select('main > div')
    $blocks
      .style('height', heights[0] + 'px')
      .style('min-height', heights[0] + 'px');
  }
}
