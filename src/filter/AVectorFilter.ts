/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AFilter from './AFilter';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';
import {SORT} from '../sortColumn/SortColumn';
import * as d3 from 'd3';
import {on,fire} from 'phovea_core/src/event';
export declare type IStringVector = IVector<string, IStringValueTypeDesc>;


export abstract class AVectorFilter<T, DATATYPE extends IVector<T, any>> extends AFilter<T, DATATYPE> {
static EVENT_SORT_FILTER = 'sortFilter';

  protected build(parent: HTMLElement) {

    let node;
    const idType = this.idtype.id;
    const element = document.querySelector(`.${idType}.filter-manager`);
    const ol = element.querySelector('.filterlist');
    node = document.createElement('div');
    ol.appendChild(node);
    node.classList.add('filter');
    this.addSortIcon(node)
    return node;
  }


  private addSortIcon(node) {
    // this.sortCriteria = SORT.asc;
    const sortIconNode = d3.select(node).append('div').classed('fa sort fa-sort-amount-asc', true);
    sortIconNode.on('click', () => {
      const b = sortIconNode.attr('class');
      if (b === 'fa sort fa-sort-amount-asc') {
        const sortMethod = SORT.desc;
        fire(AVectorFilter.EVENT_SORT_FILTER,this);

        sortIconNode.attr('class', 'fa sort fa-sort-amount-desc');
      } else {
        const sortMethod = SORT.asc;
        fire(AVectorFilter.EVENT_SORT_FILTER,this);
        sortIconNode.attr('class', 'fa sort fa-sort-amount-asc');
      }
    });

  }


}

export default AVectorFilter;
