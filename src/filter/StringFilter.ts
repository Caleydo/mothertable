/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorFilter, IStringVector} from './AVectorFilter';
import Range from 'phovea_core/src/range/Range';
import * as d3 from 'd3';

export default class StringFilter extends AVectorFilter<string, IStringVector> {
  readonly $node: d3.Selection<any>;
  private searchString: string = '';

  constructor(data: IStringVector, $parent: d3.Selection<any>) {
    super(data);
    this.$node = this.build($parent);
  }

  protected build($parent: d3.Selection<any>) {
    const $node = super.build($parent);

    this.generateLabel($node);
    this.generateSearchInput($node.select('main'));

    return $node;
  }

  private async generateSearchInput($node: d3.Selection<any>) {
    const that = this;
    const textSearch = $node.append('input')
      .attr('type', 'text')
      .classed('textSearch', true);

    textSearch.on('keyup', function (d) {
      that.searchString = this.value;
      that.triggerFilterChanged();
    });
  }

  filter(current: Range) {
    const regex = new RegExp(this.searchString, 'gi');
    return this.filterImpl(current, this.searchString.trim().length === 0 ? Promise.resolve(this.data) : this.data.filter((d) => d !== null && regex.test(d)));
  }
}
