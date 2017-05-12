export default class RowNumberColumn {
  readonly minWidth: number = 10;
  width: number = 30;
  private $node : d3.Selection<any>;
  constructor(private parent: d3.Selection<any>) {
  }

  buildHeader() {
    this.$node = this.parent.append('li')
      .attr('class', 'column column-hor nodrag aggSwitcher')
      .style('max-width', this.width + 'px')
      .style('min-width', this.minWidth + 'px');

    this.$node.append('aside');

    const $header = this.$node.append('header')
      .classed('columnHeader', true);

    //todo find a better way to calculate height (use the height of the aggregator column header
    $header.append('div').classed('labelName', true).html('&nbsp;');
    $header.append('div').classed('toolbar', true).html('&nbsp;');
    $header.append('div').classed('axis', true).html('&nbsp;');
  }

  buildInitialRows() {
    if(!this.$node) {
      return;
    }
    this.$node.append('main')
      .append('div')
      .classed('column', true);
  }
}
