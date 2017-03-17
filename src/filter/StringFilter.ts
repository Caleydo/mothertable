/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {AVectorFilter, IStringVector} from './AVectorFilter';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

export default class StringFilter extends AVectorFilter<string, IStringVector> {
  readonly $node: d3.Selection<any>;
  private _textSearch: string;

  constructor(data: IStringVector, $parent: d3.Selection<any>) {
    super(data);
    this.$node = this.build($parent);
    this._textSearch = null;
  }

  protected build($parent: d3.Selection<any>) {
    const $node = super.build($parent);

    this.generateLabel($node, this.data.desc.name);
    this.generateSearchInput($node.select('main'));

    return $node;
  }

  private async generateSearchInput($node: d3.Selection<any>) {
    const that = this;
    const textSearch = $node.append('input')
      .attr('type', 'text')
      .classed('textSearch', true);

    textSearch.on('keyup', function (d) {
      that._textSearch = this.value;
      that.triggerFilterChanged();
    });

  }


  async filter(current: Range1D) {

    const vectorView = await(<any>this.data).filter(stringPattern.bind(this, this._textSearch));
    const filteredRange = await vectorView.ids();
    const rangeIntersected = current.intersect(filteredRange);
    const fullRange = (await this.data.ids()).size();
    const vectorRange = filteredRange.size();
    this.activeFilter = this.checkFilterApplied(fullRange[0], vectorRange[0]);
    // console.log('r=', (<any>rangeIntersected).dim(0).asList(), 'f=', (<any>filteredRange).dim(0).asList());
    return rangeIntersected;
  }
}

function stringPattern(stringFilter, value, index) {
  if (stringFilter === null) {
    return value;
  }

  const re = new RegExp(`${stringFilter}`, 'gi');
  if (value.match(re) === null) {

    return;

  } else {

    return value;
  }


}
