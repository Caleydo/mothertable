/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import {EventHandler} from 'phovea_core/src/event';
import * as d3 from 'd3';

export enum EOrientation {
  Horizontal,
  Vertical
}

abstract class AColumn<T, DATATYPE extends IDataType> extends EventHandler {
  static readonly EVENT_REMOVE_ME = 'removeMe';

  constructor(public readonly data: DATATYPE, public readonly orientation: EOrientation) {
    super();
  }

  get idtype() {
    return this.data.idtypes[0];
  }

  abstract readonly node: HTMLElement;

  abstract layout(width: number, height: number);

  abstract update(idRange: Range1D);

  getVerticalMargin() {
    return {top: 0, bottom: 0};
  }

  get body() {
    return <HTMLElement>this.node.querySelector('main');
  }


  get header() {
    return <HTMLElement>this.node.querySelector('header.columnHeader');
  }


  protected get toolbar() {
    return <HTMLElement>this.node.querySelector('div.toolbar');
  }

  protected build(parent: HTMLElement) {
    const node = parent.ownerDocument.createElement('div');
    node.classList.add('column');
    node.classList.add('column-' + (this.orientation === EOrientation.Horizontal ? 'hor' : 'ver'));
    let name = this.data.desc.name;
    if (name.length > 6) {
      name = name.slice(0, 6) + '..';
    }
    node.innerHTML = `
        <header class="columnHeader">
            <div class="toolbar"></div>
            <span>${name}</span>
        </header>
        <main></main>`;

    parent.appendChild(node);

    const header = d3.selectAll("header")
      .on('mouseover', function () {
        d3.select(this).select(".toolbar")
          .style("display", "block");
      })
      .on('mouseleave', function () {
        d3.select(this).select(".toolbar")
          .style("display", "none");
      });

    this.buildBody(<HTMLElement>node.querySelector('main'));
    this.buildToolbar(<HTMLElement>node.querySelector('div.toolbar'));
    return node;
  }

  protected abstract buildBody(body: HTMLElement);

  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('beforeend', `<button class="fa fa-close"></button>`);
    toolbar.insertAdjacentHTML('beforeend', `<button class="fa sort fa-sort-amount-desc"></button>`);

    toolbar.querySelector('button.fa-close').addEventListener('click', () => {
      this.fire(AColumn.EVENT_REMOVE_ME);
      return false;
    });

  

    toolbar.querySelector('button.fa-sort-amount-desc').addEventListener('click', () => {
      const button = d3.select(toolbar).select("button.sort");
      //const button = d3.select(this).select(".toolbar").select("button.sort");
      //TODO sort the items
      if (button.classed("fa-sort-amount-desc")) {
        //want ascending order
        button.attr("class", "fa sort fa-sort-amount-asc");
        console.log("asc");
      } else {
        //want descending order
        button.attr("class", "fa sort fa-sort-amount-asc");
        console.log("desc");
      }
    });
  }


}

export default AColumn;
