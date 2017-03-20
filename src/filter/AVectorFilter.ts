/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AFilter from './AFilter';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';
import {SORT} from '../SortHandler/SortHandler';
import * as d3 from 'd3';
import {on, fire} from 'phovea_core/src/event';

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;


export abstract class AVectorFilter<T, DATATYPE extends IVector<T, any>> extends AFilter<T, DATATYPE> {
  static EVENT_SORTBY_FILTER_ICON = 'sortFilter';

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    const $ol = $parent.select('.filterlist');
    const $li = $ol.append('li').classed('filter', true);
    const $header = $li.append('header');
    $li.append('main');
    const $toolbar = $header.append('div').classed('toolbar', true);
    this.addSortIcon($toolbar);
    return $li;
  }


  protected addSortIcon($node: d3.Selection<any>) {
    const $sortButton = $node.append('a')
      .attr('title', 'Sort descending')
      .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`)
      .on('click', () => {
        if ($sortButton.select('i').classed('fa-sort-amount-asc')) {
          $sortButton
            .attr('title', 'Sort ascending')
            .html(`<i class="fa fa-sort-amount-desc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);
          const sortData = {'sortMethod': SORT.desc, col: this};
          fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        } else {
          $sortButton
            .attr('title', 'Sort descending')
            .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);
          const sortData = {'sortMethod': SORT.asc, col: this};
          fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        }
      });
  }


}

export default AVectorFilter;
