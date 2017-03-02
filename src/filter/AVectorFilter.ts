/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AFilter from './AFilter';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';
import {SORT} from '../SortEventHandler/SortEventHandler';
import * as d3 from 'd3';
import {on, fire} from 'phovea_core/src/event';
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;


export abstract class AVectorFilter<T, DATATYPE extends IVector<T, any>> extends AFilter<T, DATATYPE> {
  static EVENT_SORTBY_FILTER_ICON = 'sortFilter';

  protected build(parent: HTMLElement):HTMLElement {

    const ol = parent.querySelector('.filterlist');
    const li = <HTMLElement>document.createElement('li');
    ol.appendChild(li);
    li.classList.add('filter');

    const header = document.createElement('header');
    li.appendChild(header);
    const main = document.createElement('main');
    li.appendChild(main);

    this.addSortIcon(header);
    return li;
  }


  private addSortIcon(node: HTMLElement) {
    // this.sortCriteria = SORT.asc;
    const sortIconNode = d3.select(node).append('a').classed('fa sort fa-sort-amount-asc', true);
    sortIconNode.on('click', () => {
      const b = sortIconNode.attr('class');
      if (b === 'fa sort fa-sort-amount-asc') {
        const sortMethod = SORT.desc;
        const sortData = {'sortMethod': sortMethod, col: this};
        fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);

        sortIconNode.attr('class', 'fa sort fa-sort-amount-desc');
      } else {
        const sortMethod = SORT.asc;
        const sortData = {'sortMethod': sortMethod, col: this};
        fire(AVectorFilter.EVENT_SORTBY_FILTER_ICON, sortData);
        sortIconNode.attr('class', 'fa sort fa-sort-amount-asc');
      }
    });

  }


}

export default AVectorFilter;
