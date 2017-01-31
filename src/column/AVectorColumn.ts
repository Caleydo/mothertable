import AColumn from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc, IDataType} from 'phovea_core/src/datatype';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {MultiForm, IMultiFormOptions} from 'phovea_core/src/multiform';
import {list as rlist} from 'phovea_core/src/range';
import {scaleTo} from './utils';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  protected multiform: MultiForm;

  constructor(data: DATATYPE) {
    super(data);
  }

  protected multiFormParams(): IMultiFormOptions {
    return {
      initialVis: 'phovea-vis-heatmap1d'
    };
  }

  protected buildBody(body: HTMLElement) {
    this.multiform = this.createMultiForm(this.data, body);
  }

  private createMultiForm(data: IDataType, body: HTMLElement) {
    const m = new MultiForm(this.data, body, this.multiFormParams());
    const toolbar = this.toolbar;
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

export default AVectorColumn;
