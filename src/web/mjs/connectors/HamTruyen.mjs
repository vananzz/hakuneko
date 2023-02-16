import Connector from '../engine/Connector.mjs';
import Manga from '../engine/Manga.mjs';

export default class HamTruyen extends Connector {

    constructor() {
        super();
        super.id = 'hamtruyen';
        super.label = 'HamTruyen';
        this.tags = [ 'manga', 'webtoon', 'vietnamese' ];
        this.url = 'http://truyentranh8.org/';
    }

    async _getMangaFromURI(uri) {
        let request = new Request(uri, this.requestOptions);
        let data = await this.fetchDOM(request, 'meta[property="og:title"]');
        let id = uri.pathname + uri.search;
        let title = data[0].content.trim();
        return new Manga(this, id, title);
    }

    async _getMangas() {
        let mangaList = [];
        for(let page = 1, run = true; run; page++) {
            let mangas = await this._getMangasFromPage(page);
            mangas.length > 0 ? mangaList.push(...mangas) : run = false;
        }
        return mangaList;
    }

    async _getMangasFromPage(page) {
        let request = new Request(new URL(`/search.php?act=all&andor=and&sort=ten&view=thumb&page=${page}`, this.url), this.requestOptions);
        let data = await this.fetchDOM(request, 'div#tblChap.row:not([class*=" "]) h3 a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.text.trim()
            };
        });
    }

    async _getChapters(manga) {
        let request = new Request(new URL(manga.id, this.url), this.requestOptions);
        let data = await this.fetchDOM(request, 'ul#ChapList.mangadetail-chaplist:not([class*=" "]) li a');
        return data.map(element => {
            return {
                id: this.getRootRelativeOrAbsoluteLink(element, this.url),
                title: element.children && element.children[0] && element.children[0].textContent || element.text.trim(),
                language: ''
            };
        });
    }

    async _getPages(chapter) {
        let request = new Request(new URL(chapter.id, this.url), this.requestOptions);
        let data = await this.fetchDOM(request, '.page-chapter source');
        return data.map(element => this.getAbsolutePath(element.src, request.url));
    }
}
