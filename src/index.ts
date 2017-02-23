/**
 * Created by Caleydo Team on 31.08.2016.
 */

import 'file-loader?name=index.html!extract-loader!html-loader!./index.html';
import 'file-loader?name=404.html-loader!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'phovea_ui/src/_bootstrap';
import 'phovea_ui/src/_font-awesome';
import './style.scss';
import {create as createApp} from './app2';
import {create as createHeader, AppHeaderLink} from 'phovea_ui/src/header';
import {APP_NAME} from './language';

const header = createHeader(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  {appLink: new AppHeaderLink(APP_NAME)}
);

const parent = <HTMLElement>document.querySelector('#app');

const app = createApp(parent);
header.wait();
app.build().then(() => header.ready());
