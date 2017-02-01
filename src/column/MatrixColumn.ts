import AColumn from './AColumn';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {list as rlist} from 'phovea_core/src/range';
import {IDataType} from 'phovea_core/src/datatype';
import {scaleTo} from './utils';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export default class MatrixColumn extends AColumn<number, INumericalMatrix> {
  readonly node: HTMLElement;
  private multiform: MultiForm;

  constructor(data: INumericalMatrix, columnParent: HTMLElement) {
    super(data);
    this.node = this.build(columnParent);
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: 'phovea-vis-heatmap'
    };
  }
  protected buildBody(body: HTMLElement) {
    this.multiform = this.createMultiForm(this.data, body);
  }
  
  protected buildToolbar(toolbar: HTMLElement) {
    toolbar.insertAdjacentHTML('afterbegin', `<div class="vislist"></div>`);
    super.buildToolbar(toolbar);
  }

  private createMultiForm(data: IDataType, body: HTMLElement) {
    const m = new MultiForm(this.data, body, this.multiFormParams());
    const toolbar = <HTMLElement>this.toolbar.querySelector('div.vislist');
    toolbar.innerHTML = '';
    m.addIconVisChooser(toolbar);
    return m;
  }

  layout(width: number, height: number) {
    scaleTo(this.multiform, width, height);
  }

  update(idRange: CompositeRange1D) {
    this.multiform.destroy();
    this.data.idView(rlist(idRange)).then((view) => {
        this.multiform = this.createMultiForm(view, this.body);
    });
  }
}
