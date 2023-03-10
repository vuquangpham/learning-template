import Home from './pages/Home/index';
import NotFound from './pages/NotFound/index';
import Preloader from './components/Preloader';
import Aside from "@/components/Aside";
import "@viivue/easy-tab-accordion";
import Prism from './components/Prism';

class App{
    constructor(){
        this.createContent();

        this.createPreloader();
        this.createPages();

        this.afterPageLoaded();
    }

    afterPageLoaded(){
        this.addEventListener();
        this.initEta();
        this.asideElement = new Aside();

        Prism.highlightAll();
    }

    // get content and template from different pages
    createContent(){
        this.content = document.querySelector('.content');
        this.template = this.content.getAttribute('data-template'); // this.content.dataset.template is the equivalent but not supported for Safari
    }

    createPages(){
        this.pages = {
            home: new Home(),
            error: new NotFound(),
        };

        this.dynamicImportPage().then(() => {
            this.page = this.pages[this.template];
        });
    }

    dynamicImportPage(){
        return new Promise((resolve) => {
            // smart import
            if(!this.pages[this.template]){
                import(`@/pages/${this.template}`)
                    .then((instance) => {
                        console.log(instance);
                        this.pages[this.template] = new instance.default();
                        resolve();
                    });
            }else{
                resolve();
            }
        });
    }

    createPreloader(){
        this.preloader = new Preloader();
    }

    /**
     * Events
     * */

    onPreloaded(){
        this.preloader.destroy();
        this.page.show();
    }

    async handlePageChange({url, push = true}){
        await this.page.hide();
        const request = await window.fetch(url);

        if(request.status === 200){
            const html = await request.text();
            const div = document.createElement('div');

            div.innerHTML = html;
            const divContent = div.querySelector('.content');
            this.template = divContent.getAttribute('data-template');

            this.content.setAttribute('data-template', this.template);
            this.content.innerHTML = divContent.innerHTML;

            if(push){
                window.history.pushState({}, '', url);
            }

            this.dynamicImportPage().then(() => {
                this.page = this.pages[this.template];
                this.page.create();
                this.page.show();

                this.afterPageLoaded();
            });
        }else{
            console.log("Error!");
        }
    }

    onPopState(){
        this.handlePageChange({url: window.location.pathname, push: false});
    }

    /**
     * Init ETA
     * */
    initEta(){
        const getActiveSection = () => {
            const allList = document.querySelectorAll('aside ul.menu > li');
            return Array.from(allList).findIndex(li => li.classList.contains('active-base'));
        };

        // generate ETA
        ETA.init({
            el: this.content.querySelector('#data-eta'),
            activeSection: getActiveSection()
        });
    }

    /**
     * Listeners
     * */
    addEventListener(){
        // Handle links click
        this.addLinksListener();

        // handlePopstate
        window.addEventListener('popstate', this.onPopState.bind(this));
    }

    addLinksListener(){
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                const {href} = link;
                this.handlePageChange({url: href});
            });
        });
    }
}

new App();