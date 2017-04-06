/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AFilter from './AFilter';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';
import {SORT} from '../SortHandler/SortHandler';
import * as d3 from 'd3';
import {on, fire} from 'phovea_core/src/event';
import {AVectorColumn} from '../column/AVectorColumn';

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;


export abstract class AVectorFilter<T, DATATYPE extends IVector<T, any>> extends AFilter<T, DATATYPE> {
  static EVENT_SORTBY_FILTER_ICON = 'sortFilter';
  private $sortButton;

  protected build($parent: d3.Selection<any>): d3.Selection<any> {
    const $ol = $parent.select('.filterlist');
    const $li = $ol.append('li').classed('filter', true).attr('filter-name', this.data.desc.id);
    const $header = $li.append('header');
    $li.append('main');
    const $toolbar = $header.append('div').classed('toolbar', true);
    this.addSortIcon($toolbar);
    this.addTrashIcon($toolbar);
    return $li;
  }


  protected addSortIcon($node: d3.Selection<any>) {
    this.$sortButton = $node.append('a')
      .attr('title', 'Sort ascending')
      .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);

    this.$sortButton.on('click', () => {
      if (this.$sortButton.select('i').classed('fa-sort-amount-asc')) {
        const sortData = {sortMethod: SORT.desc, col: this};
        this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        this.updateSortIcon(SORT.desc);
      } else {
        const sortData = {sortMethod: SORT.asc, col: this};
        this.fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        this.updateSortIcon(SORT.asc);
      }
    });

  }


  updateSortIcon(sortMethod) {
    if (sortMethod === SORT.desc) {
      this.$sortButton
        .attr('title', 'Sort ascending')
        .html(`<i class="fa fa-sort-amount-desc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort descending</span>`);

    } else {
      this.$sortButton
        .attr('title', 'Sort descending')
        .html(`<i class="fa fa-sort-amount-asc fa-fw" aria-hidden="true"></i><span class="sr-only">Sort ascending</span>`);

    }
  }


}

export default AVectorFilter;

