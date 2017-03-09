/**
 * Created by Holger Stitz on 09.03.2017.
 */

import * as $ from 'jquery';
import {EventHandler} from 'phovea_core/src/event';


export class URLHash extends EventHandler {

  static readonly CHANGED = 'changed';

  private static readonly HASHMARK = '#';
  private static readonly DELIMITER = ';';
  private static readonly CONCATINATOR = '=';

  private static readonly urlHash = new URLHash();

  static get instance() {
    return URLHash.urlHash;
  }

  private static set hash(hash:string) {
    window.location.hash = hash;
  }

  public static hashToProps(hash:string):Map<string, string> {
    return new Map<string, string>(
      hash
      .substring(this.HASHMARK.length)
      .split(this.DELIMITER)
      .filter((d) => d.length > 0)
      .map((d) => <[string, string]>d.split(this.CONCATINATOR))
    );
  }

  public static propsToHash(props:Map<string, string>):string {
    return this.HASHMARK + Array.from(props.entries())
      .map((d) => d.join(this.CONCATINATOR))
      .join(this.DELIMITER);
  }

  private _properties:Map<string, string> = new Map();

  constructor() {
    super();
    this.attachListener();
  }

  private attachListener() {
    $(window)
      .bind('hashchange', (e) => {
        this._properties = URLHash.hashToProps(window.location.hash);
        this.fire(URLHash.CHANGED, this._properties);
      })
      .trigger('hashchange');
  }

  get(key:string):string {
    return this._properties.get(key);
  }

  has(key:string):boolean {
    return this._properties.has(key);
  }

  set(key:string, value:string) {
    this._properties.set(key, value);
    URLHash.hash = URLHash.propsToHash(this._properties);
  }

  delete(key:string) {
    this._properties.delete(key);
    URLHash.hash = URLHash.propsToHash(this._properties);
  }

}
