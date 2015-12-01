var AddressDadata = React.createClass({displayName: "AddressDadata",
    mixins: [EventEmitterMixin, SuggestAddressDaDataMixin],
    getInitialState: function() {
        return {value: this.props.value ? decodeURIComponent(this.props.value) : ""};
    },
    getDefaultProps: function() {
        return {
            suggestTimeout: 500
        };
    },
    componentWillUnmount: function() {
        if (this.$suggestTimeoutId) {
            clearTimeout(this.$suggestTimeoutId);
        }
    },
    componentWillReceiveProps: function(nextProps) {
        var value = nextProps.value;
        if (_.isObject(value)) {
            value = value.value;
        }
        if (value !== this.state.value) {
            this.setState({
                value: value
            });
        }
    },
    onChange: function(value) {
        if (value === this.state.value) {
            return;
        }

        this.setState({value: value});
        this.props.onChange(this.props.id, value);

        this.getSuggestions(value);
    },
    getSuggestions: function(value) {
        var that = this;

        if (this.$suggestTimeoutId) {
            clearTimeout(this.$suggestTimeoutId);
        }

        this.$suggestionDefer = $.Deferred();
        this.$suggestTimeoutId = setTimeout(function() {
            var queryObject = {
                "query": value,
                "count": 5,
                "restrict_value": true
            };
            if (that.props.city){
                queryObject.locations = [{"city": that.props.city}]
            }
            if (that.props.region){
                queryObject.locations = [{"region": that.props.region}]
            }
            that.suggestAddress(queryObject).then(function(data) {
                if (that.$suggestionDefer.state() !== "rejected") {
                    that.$suggestionDefer.resolve();
                    that.setState({
                        addressSuggests: data
                    });
                }
            });
        }, this.props.suggestTimeout);
    },
    changeIndex: function(fieldId, postalCode) {
        if (postalCode && this.props.linkedFieldIndexId) {
            this.dispatch("valuechanged", { fieldName: fieldId, fieldValue: postalCode });
        }
    },
    onSuggestSelect: function(data){
        this.setState({
            addressSuggests: []
        });

        var text = this.getSuggestionText(data).substring(0, this.props.maxLength);
        var postalCode = this.getSuggestionPostalCode(data);

        this.setState({value: text});
        this.props.onChange(this.props.id, {value: text, invalid: false});

        this.changeIndex(this.props.linkedFieldIndexId, postalCode);
    },
    onSuggestHide: function() {
        this.setState({
            addressSuggests: []
        });
    },
    onBlur: function() {
        if (this.$suggestionDefer && this.$suggestionDefer.state() !== "resolved") {
            this.$suggestionDefer.reject("cancelled");
        }

        this.setState({
            addressSuggests: []
        });
    },
    render: function() {
        return (
            React.createElement(Input, {label: this.props.label, errorMessage: this.props.errorMessage, invalid: this.props.invalid, maxLength: this.props.maxLength, 
                className: this.props.className, onChange: this.onChange, value: this.state.value, onFocus: this.props.onFocus, onBlur: this.onBlur}, 
                 this.state.addressSuggests && this.state.addressSuggests.length ?
                    React.createElement(DropdownElements, {elements: this.state.addressSuggests, onHide: this.onSuggestHide, onElementSelect: this.onSuggestSelect, matchValue: this.state.value})
                : false
            )
        );
    }
});

var EmptyPageNote = React.createClass({displayName: "EmptyPageNote",
    render: function(){
        return (
            React.createElement("div", {className: "empty-page-note"}, 
                React.createElement("div", {className: "empty-page-note__text"}, this.props.text), 
                this.props.children
            )
        );
    }
});
var Header = React.createClass({displayName: "Header",
    userMenuElements: [
        {
            text: "Мои отправления",
            data: "tracking"
        },
        {
            text: "Личный кабинет",
            data: "user-profile"
        },
        {
            text: "Выйти",
            data: "exit"
        }
    ],
    getInitialState: function() {
        var isAuthorized = this.props.authorized || document.cookie.indexOf("auth=1") !== -1, that = this;
        if (isAuthorized) {
            $.get(this.props.getTrackItemsUpdatedCountUrl, {hid: this.props.personHid, locale: "ru"}, function( data ) {
                that.setState({ updatesCount: data });
            });
        }
        return {
            authorized: isAuthorized,
            name: this.props.userName ? this.props.userName : "Имя пользователя",
            /*pendingCount: this.props.hasJustArrived ? 1 : false,*/
            postIdLoginUrl: this.props.postIdLoginUrl ? this.props.postIdLoginUrl : "/pochta-id/build/main.html",
            postIdUserAccountUrl: this.props.postIdUserAccountUrl ? this.props.postIdUserAccountUrl : "",
            trackingURL: this.props.trackingURL ? this.props.trackingURL : "tracking.html",
            postIdLogoutUrl: this.props.postIdLogoutUrl,
            updatesCount: null
        };
    },
    componentDidUpdate: function(prevProps, prevState) {
        var oldShow = prevState.showMobileMenu;
        var newShow = this.state.showMobileMenu;
        if (!oldShow && newShow) {
            setTimeout(function()  {
                $(document).bind("click touchend", this.handleDocumentClick);
            }.bind(this), 0);
        }
        else if (oldShow && !newShow) {
            $(document).unbind("click touchend", this.handleDocumentClick);
        }
    },
    handleDocumentClick: function(event) {
        var $target = $(event.target);
        var isInsideMobileMenu = !!$target.closest(this.refs.mobileMenu.getDOMNode()).length;
        if (!isInsideMobileMenu) {
            this.setState({
                showMobileMenu: false
            });
        }
    },
    onBalloonToggle: function() {
        setTimeout(function()  {
            var $balloon = $(this.getDOMNode()).find(".header__user-menu-balloon");
            var $btn = $(this.getDOMNode()).find(".header__btn-user-menu");
            if ($balloon.is(":visible")) {
                $balloon.toggleClass("header__user-menu-balloon--right-align", $btn.width() < $balloon.outerWidth());
            }
        }.bind(this), 0);
    },
    onChange: function(key, val){
        var obj = {};
        obj[key] = val;
        this.setState(obj);
    },
    onUserMenuSelect: function(val){
        if (val === "exit"){
            if(this.state.postIdLogoutUrl) {
                location.href = this.state.postIdLogoutUrl;
            }
            else {
                document.cookie = 'auth=0; expires=Fri, 3 Aug 1970 20:47:11 UTC; path=/';
                location.reload();
            }
        }
        else if (val === "user-profile"){
            location.href = this.state.postIdUserAccountUrl;
        }
        else if (val === "tracking"){
            location.href = this.state.trackingURL;
        }
    },
    onAuthorize: function(){
        location.href = this.state.postIdLoginUrl;
    },
    toggleMobileMenu: function() {
        this.setState({
            showMobileMenu: !this.state.showMobileMenu
        });
    },
    render: function(){
        var cx = React.addons.classSet;
        var allServicesButtonClasses = cx({
            "header__btn-all-services": true
        });
        var isMobile = isMobileDevice();
        var isAuthorized = this.state.authorized;
        var updatesCount = parseInt(this.state.updatesCount);
        var showUpdatesCount = !!(updatesCount) && updatesCount > 0;
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "header"}, 
                    React.createElement("a", {className: "header__logo", href: "/"}), 
                    React.createElement("div", {className: "header__menu"}, 
                        React.createElement("a", {href: "/support", className: allServicesButtonClasses}, "Помощь"), 
                         isAuthorized && showUpdatesCount && React.createElement("a", {href: this.state.trackingURL, className: "header__menu-updates-count"}, updatesCount), 
                         isAuthorized &&
                            React.createElement(Balloon, {align: "left", ref: "balloon", elements: this.userMenuElements, onSelect: this.onUserMenuSelect, className: "header__user-menu-balloon", onClick: this.onBalloonToggle}, 
                                React.createElement("div", {className: "text-button header__btn-user-menu"}, this.state.name)
                            ), 
                        
                         !isAuthorized && React.createElement("a", {href: this.state.postIdLoginUrl, className: "header__btn-login", onClick: this.onAuthorize}, "Войти")
                    ), 
                    React.createElement("div", {className: "header__mobile-menu-btn", onTouchEnd: this.toggleMobileMenu, onClick: !isMobile && this.toggleMobileMenu}, 
                         isAuthorized && showUpdatesCount && React.createElement("div", {className: "header__menu-updates-count"}, updatesCount), 
                        React.createElement("div", {className: "header__mobile-menu-btn-icon"})
                    )
                ), 
                React.createElement(MobileMenu, React.__spread({ref: "mobileMenu"},  this.state))
            )
        );
    }
});

var MobileMenu = React.createClass({displayName: "MobileMenu",
    getInitialState: function() {
        return null;
    },
    componentWillReceiveProps: function(nextProps) {
        var $stickySummary = $(".product-sticky-summary-container");
        var $body = $("body");
        $body.off("transitionend webkitTransitionEnd");
        var isChanged = nextProps.showMobileMenu !== this.props.showMobileMenu;
        if (!isChanged) {
            return;
        }

        var isIOS = device.ios();

        if (nextProps.showMobileMenu) {
            if (!isIOS) {
                $("html").css("overflow", "hidden");
            }
        }
        else {
            $("html").css("overflow", "");
        }

        if ($stickySummary.length) {
            // Android browser 4.3 and older has broken fixed positioning inside transformed elements
            var isModernBrowser = "transition" in $stickySummary[0].style;

            if (nextProps.showMobileMenu) {
                if (isModernBrowser) {
                    var top = $stickySummary.offset().top - $(".header-container").outerHeight() - (isIOS ? 0 : $("body").scrollTop());
                    $stickySummary.css({
                        "top": top
                    });
                }
            }
            else {
                if (isModernBrowser) {
                    $body.one("transitionend webkitTransitionEnd", function() {
                        $stickySummary.css("top", "");
                        $body.off("transitionend webkitTransitionEnd");
                    });
                }
                else {
                    $stickySummary.css("top", "");
                }
            }
        }
        $body.toggleClass("body--mobile-menu", nextProps.showMobileMenu);
    },
    onTouchStart: function(event) {
        this.startY = event.touches[0].clientY;
    },
    // workaround for iOS bug when scrollable element "hangs" on out-of-bounds scroll start
    onTouchMove: function(event) {
        var oldY = this.startY;
        if (oldY === null) {
            return;
        }
        var newY = event.touches[0].clientY;
        var node = this.refs.menu.getDOMNode();
        var maxScroll = node.scrollHeight - node.offsetHeight;
        var delta = newY - oldY;
        var scrollTop = node.scrollTop;
        var newScroll = node.scrollTop - delta;
        var overTopBounds = !scrollTop && newScroll < 0;
        var underBottomBounds = scrollTop >= maxScroll && newScroll > maxScroll;
        if (overTopBounds || underBottomBounds) {
            this.startY = newY;
            event.preventDefault();
        }
        else {
            this.startY = null;
        }
    },
    render: function() {
        var cx = React.addons.classSet;
        var classes = cx({
            "mobile-menu-wrapper": true,
            "mobile-menu-wrapper--visible": this.props.showMobileMenu
        });
        var path = location.pathname.replace(/.*\/build\/(.*)/, "$1")
                                    .replace(/\/$/, "")
                                    .split("/")
                                    .pop();
        path = "/" + path;
        return (
            React.createElement("div", {className: classes}, 
                React.createElement("div", {ref: "menu", className: "mobile-menu", onTouchStart: this.onTouchStart, onTouchMove: this.onTouchMove}, 
                    React.createElement(MobileMenuSiteNavigation, {path: path}), 
                    React.createElement(MobileMenuUser, React.__spread({},  this.props)), 
                    React.createElement(MobileMenuCompany, {path: path}), 
                    React.createElement(MobileMenuSocials, null)
                )
            )
        );
    }
});

var MobileMenuSiteNavigation = React.createClass({displayName: "MobileMenuSiteNavigation",
    buttons: [
        { link: "/", text: "Главная" },
        { link: "/tracking", text: "Отследить" },
        { link: "/letters", text: "Письма" },
        { link: "/parcels", text: "Посылки" },
        { link: "/money-transfer", text: "Денежные переводы" },
        { link: "/offices", text: "Отделения" },
        { link: "/forms-list", text: "Бланки" },
        { link: "/support", text: "Помощь" }
    ],
    render: function() {
        return (
            React.createElement("div", {className: "mobile-menu__site-navigation"}, 
                _.map(this.buttons, function(button, i) 
                    {return React.createElement(MobileMenuSiteNavigationButton, React.__spread({key: i},  button, {path: this.props.path}));}.bind(this)
                )
            )
        );
    }
});

var MobileMenuSiteNavigationButton = React.createClass({displayName: "MobileMenuSiteNavigationButton",
    render: function() {
        var cx = React.addons.classSet;
        var link = this.props.link;
        var path = this.props.path;
        var isActive = link === path || link === "/" && !path;
        var classes = cx({
            "mobile-menu__site-navigation-button": true,
            "mobile-menu__site-navigation-button--active": isActive
        });
        return (
            isActive ?
                React.createElement("div", {className: classes}, this.props.text)
            :
                React.createElement("a", {href: this.props.link, className: classes}, this.props.text)
        );
    }
});

var MobileMenuUser = React.createClass({displayName: "MobileMenuUser",
    getInitialState: function() {
        if (this.props.authorized) {
            this.buttons = [
                { name: "username", text: this.props.name, user: true },
                { name: "tracking", link: "/tracking", text: "Мои отправления", count: null },
                { name: "account", link: this.props.postIdUserAccountUrl, text: "Личный кабинет" },
                { name: "logout", link: this.props.postIdLogoutUrl, text: "Выйти" }
            ];
        }
        else {
            this.buttons = [
                { link: this.props.postIdLoginUrl, text: "Войти", user: true }
            ];
        }
        return null;
    },
    render: function() {
        var updatesCount = parseInt(this.props.updatesCount);
        return (
            React.createElement("div", {className: "mobile-menu__user"}, 
                _.map(this.buttons, function(button, i) {
                    if (button.name === "tracking") {
                        button.count = !!(updatesCount) ? updatesCount : null;
                    }
                    return React.createElement(MobileMenuUserButton, React.__spread({key: i},  button));
                }
                )
            )
        );
    }
});

var MobileMenuUserButton = React.createClass({displayName: "MobileMenuUserButton",
    render: function() {
        var cx = React.addons.classSet;
        var classes = cx({
            "mobile-menu__user-button": true,
            "mobile-menu__user-button--user": this.props.user
        });
        return (
            this.props.link ?
                React.createElement("a", {href: this.props.link, className: classes}, 
                    this.props.text, 
                    !!this.props.count && React.createElement("div", {className: "mobile-menu__user-button-count"}, this.props.count)
                )
            :
                React.createElement("div", {className: classes}, 
                    this.props.text, 
                    !!this.props.count && React.createElement("div", {className: "mobile-menu__user-button-count"}, this.props.count)
                )
        );
    }
});

var MobileMenuCompany = React.createClass({displayName: "MobileMenuCompany",
    buttons: [
        { link: "/news-list", text: "Пресс-центр" },
        { link: "/about-missia", text: "О компании" }
    ],
    render: function() {
        return (
            React.createElement("div", {className: "mobile-menu__company"}, 
                _.map(this.buttons, function(button, i) 
                    {return React.createElement(MobileMenuCompanyButton, React.__spread({key: i},  button));}
                )
            )
        );
    }
});

var MobileMenuCompanyButton = React.createClass({displayName: "MobileMenuCompanyButton",
    render: function() {
        return React.createElement("a", {href: this.props.link, className: "mobile-menu__company-button"}, this.props.text);
    }
});

var MobileMenuSocials = React.createClass({displayName: "MobileMenuSocials",
    render: function() {
        return (
            React.createElement("div", {className: "mobile-menu__socials"}, 
                React.createElement("a", {target: "_blank", href: "http://vk.com/russianpost", className: "mobile-menu__socials-button mobile-menu__socials-button--vk"}), 
                React.createElement("a", {target: "_blank", href: "http://www.facebook.com/ruspost?filter=2", className: "mobile-menu__socials-button mobile-menu__socials-button--fb"}), 
                React.createElement("a", {target: "_blank", href: "https://twitter.com/ruspostofficial", className: "mobile-menu__socials-button mobile-menu__socials-button--twitter"})
            )
        );
    }
});

var TrackingHelpBalloon = React.createClass({displayName: "TrackingHelpBalloon",
    render: function(){
        var trackingBalloon = (
            React.createElement("div", null, "Номер почтового отправления напечатан на чеке. Его выдают отправителю в почтовом отделении.")
        );
        return (
            React.createElement(Balloon, {content: trackingBalloon, className: "tracking-help-balloon", containerClassName: "tracking-help-balloon-container"}, 
                React.createElement("div", {className: "text-button tracking-help " + (this.props.className || "")}, "Как узнать номер отправления", React.createElement("div", {className: "help-button"}))
            )
        );
    }
});
var AddFile = React.createClass({displayName: "AddFile",
    getInitialState: function(){
        return {
            files: [{
                id: _.uniqueId("file-")
            }],
            multiple: this.props.multiple !== false,
            prefix: this.props.prefix ? this.props.prefix : "file-"
        };
    },
    onAdd: function(id){
        var files = this.state.files;
        if (this.state.multiple){
            files.push({id: _.uniqueId("file-")});
        }
        this.setState({files: files});
    },
    onDelete: function(id){
        var files;
        if (this.state.multiple){
            files = _.filter(this.state.files, function(file){
                return file.id !== id;
            });
        }
        else {
            files = [{id: _.uniqueId("file-")}];
        }
        this.setState({files: files});
    },
    render: function(){
        var cx = React.addons.classSet;
        var that = this;
        return (
            React.createElement("div", {className: "add-file" + " " + (this.props.className ? this.props.className : "")}, 
                React.createElement("form", {action: this.props.uploadURL, method: "POST", encType: "multipart/form-data"}, 
                    _.map(this.state.files, function(file, i){
                        var name = that.state.prefix;
                        if (that.state.multiple){
                            name += i;
                        }
                        return (
                            React.createElement(AddFileElement, React.__spread({name: name, key: file.id, onAdd: that.onAdd},  that.props, {onDelete: that.onDelete, multiple: that.state.multiple, id: file.id}))
                        );
                    })
                )
            )
        );
    }
});

var AddFileElement = React.createClass({displayName: "AddFileElement",
    getInitialState: function(){
        return {
            addButton: true,
            name: this.props.moreLabel && this.props.files.length ? this.props.moreLabel : this.props.label,
            progress: 0
        };
    },
    componentDidMount: function(){
        var input = this.refs.input.getDOMNode();
        if (window.mOxie){
            var fileInput = new mOxie.FileInput({
                browse_button: this.getDOMNode(),
                multiple: this.props.multiple // allow multiple file selection
            });

            fileInput.onchange = this.handleFile;
            fileInput.init();
        }
    },
    componentWillUpdate: function(nextProps, nextState){
        if (this.state.progress !== nextState.progress){
            this.updateProgress(this.state.progress, nextState.progress);
        }
    },
    updateProgress: function(oldProgress, newProgress){
        $(this.getDOMNode()).circleProgress({
            value: newProgress,
            animationStartValue: oldProgress
        });
    },
    handleFile: function(evt) {
        var that = this;
        var file = $(evt.target).prop('files')[0];

        var onprogress = function(progress){
            var progress = progress.total ? progress.loaded / progress.total : 1;
            that.setState({progress: progress});
        };
        var onloadend = function (evt) {
            that.setState({
                uploaded: true,
                uploading: false
            });
        };

        var formData = window.FormData ? new FormData : new mOxie.FormData();
        formData.append("file", file, file.name);
        $.ajax({
            url: 'upload.php',  //Server script to process data
            type: 'POST',
            xhr: function() {  // Custom XMLHttpRequest
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){ // Check if upload property exists
                    myXhr.upload.onprogress = onprogress;
                    myXhr.upload.addEventListener("progress", onprogress, false);
                    myXhr.upload.addEventListener("load", onloadend, false);
                }
                return myXhr;
            },
            //Ajax events
            //beforeSend: beforeSendHandler,
            success: onloadend,
            error: function(arg1, arg2){
                return;
            },
            // Form data
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });

        $(this.getDOMNode()).circleProgress({
            value: 0,
            size: 18,
            animation: {
                duration: 100,
                easing: "linear"
            },
            thickness: 3,
            startAngle: -1.58,
            fill: {
                color: "#999"
            },
            emptyFill: "#FFF"
        });

        this.setState({
            name: file.name,
            size: file.size,
            type: file.type,
            uploading: true,
            addButton: false
        });

        this.props.onAdd(this.props.id);
    },
    onAddClick: function(){
        if (window.mOxie) return;
        var input = this.refs.input.getDOMNode();
        input.click();
    },
    onDeleteClick: function(){
        this.props.onDelete(this.props.id);
    },
    render: function(){
        var cx = React.addons.classSet;
        var elementClasses = cx({
            'add-file-button': true,
            'add-file-button--progress': this.state.uploading,
            'add-file-button--uploaded': this.state.uploaded
        });
        var titleClasses = cx({
            'add-file-button__filename': !this.state.addButton,
            'add-file-button__title': this.state.addButton
        });

        return (
            React.createElement("div", {className: elementClasses, onClick: this.state.addButton ? this.onAddClick : false}, 
                React.createElement("div", {className: "add-file-button__icon", onClick: this.state.uploaded ? this.onDeleteClick : false}), 
                React.createElement("div", {className: titleClasses},  this.state.name), 
                React.createElement("input", {name: this.props.name, type: "file", multiple: this.props.multiple, hidden: true, className: "ws-filereader", ref: "input", multiple: false && this.props.multiple, accept: "*", onChange: this.handleFile})
            )
        );
    }
});
var Balloon = React.createClass({displayName: "Balloon",
    prepareElements: function(elements) {
        return _.isArray(elements) && _.map(elements, function(element) {
            if (!_.isObject(element)) {
                element = {
                    text: element,
                    data: element
                };
            }
            else if (!_.has(element, "data")) {
                element.data = element.text;
            }
            return element;
        });
    },
    getInitialState: function() {
        return {
            open: this.props.open,
            uid: _.uniqueId("balloon-1"),
            elements: this.prepareElements(this.props.elements),
            align: this.props.align || "center",
            marginLeft: this.props.marginLeft || 0,
            isMenu: !!this.props.elements,
            mount: false
        };
    },
    componentDidMount: function() {
        var node = this.getDOMNode();
        this.setState({
            element: $(node).children().first()
        });
    },
    componentWillUnmount: function() {
        $(document).unbind("click", this.handleDocumentClick);
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (this.state.open) {
            $(document).bind("click", this.handleDocumentClick);
        }
        else {
            $(document).unbind("click", this.handleDocumentClick);
        }
    },
    componentWillMount: function() {
        this.setState({
            open: this.props.open
        });
    },
    componentWillReceiveProps: function(props) {
        var state = {
            elements: this.prepareElements(props.elements)
        };
        if (_.isBoolean(props.open)) {
            state.open = props.open;
        }
        this.setState(state);
    },
    handleDocumentClick: function(event) {
        if ($(event.target).closest(this.getDOMNode()).length) {
            return;
        }
        this.close();
    },
    open: function() {
        this.setState({
            open: true
        });
    },
    close: function() {
        this.setState({
            open: false
        });
    },
    toggle: function(event) {
        this.setState({
            open: !this.state.open
        });
        event.stopPropagation();
        if (_.isFunction(this.props.onClick)) {
            this.props.onClick(event);
        }
    },
    onSelect: function(data) {
        this.close();
        if (_.isFunction(this.props.onSelect)) {
            this.props.onSelect(data);
        }
    },
    render: function() {
        var that = this;
        return (
            React.createElement("span", {className: "balloon-toggle-button " + (this.props.containerClassName || "")}, 
                React.addons.cloneWithProps(this.props.children, {
                    onClick: this.toggle,
                    ref: "button"
                }), 
                React.createElement(React.addons.CSSTransitionGroup, {transitionName: "balloon"}, 
                     this.state.open && ((this.state.elements && this.state.elements.length) || this.props.content) ?
                        React.createElement(BalloonInner, React.__spread({},  this.state, {key: this.state.uid, className: this.props.className, arrowPosition: this.props.arrowPosition, onClick: this.props.onClick}), 
                            this.state.elements ?
                                _.map(this.state.elements, function(element, i) {
                                    return React.createElement(BalloonMenuElement, {key: i, onClick: that.onSelect.bind(that, element.data)}, element.text);
                                })
                            : this.props.content
                        )
                    : false
                )
            )
        );
    }
});

var BalloonInner = React.createClass({displayName: "BalloonInner",
    mixins: [React.addons.PureRenderMixin],

    componentDidMount: function() {
        this.show();
    },
    show: function(cb) {
        var $balloon = $(this.getDOMNode());
        var options = _.extend({
            "marginLeft": 0
        }, this.props);

        if (options.element) {
            $balloon.css("left", 0)
            .find(".balloon-arrow").css("left", "");
        }

        if (options.element) {
            var left;
            var $element = $(options.element);
            var $arrow = $balloon.find(".balloon__arrow");
            var elementLeft = $element.offset().left;
            var elementWidth = $element.outerWidth();
            var menuWidth = $balloon.outerWidth();
            var menuLeft = $balloon.offset().left;
            var wndWidth = $(window).innerWidth();
            var elementCenter = options.elementCenter ? options.elementCenter : elementWidth / 2;

            calcAlign();

            $balloon.css("left", left);
        }

        function calcAlign() {
            switch (options.align) {
                case "left":
                    left = elementLeft - menuLeft;

                    if (menuWidth > elementWidth) {
                        $arrow.css("left", elementWidth / 2);
                    }

                    break;
                case "center":
                    left = elementLeft - menuLeft + (elementCenter - menuWidth / 2);

                    if (menuLeft + left < 0) {
                        options.align = "left";
                        calcAlign();
                    }
                    else if (menuLeft + menuWidth + left > wndWidth) {
                        options.align = "right";
                        calcAlign();
                    }

                    break;
                case "right":
                    left = (elementLeft + elementWidth) - (menuLeft + menuWidth);

                    if (menuWidth > elementWidth) {
                        $arrow.css("left", menuWidth - elementWidth + elementCenter);
                    }

                    break;
                default:
                    break;
            }

            return left;
        }
    },
    render: function() {
        var cx = React.addons.classSet;
        var balloonClasses = cx({
            "balloon": true,
            "balloon--menu": this.props.isMenu,
            "balloon--arrow-bottom": this.props.arrowPosition === "bottom"
        });
        return (
            React.createElement("div", {className: balloonClasses + " " + (this.props.className ? this.props.className : ""), onClick: this.props.onClick}, 
                React.createElement("div", {className: "balloon__arrow"}, 
                    React.createElement("div", {className: "balloon__arrow__shadow"})
                ), 
                this.props.children
            )
        );
    }
});

var BalloonMenuElement = React.createClass({displayName: "BalloonMenuElement",
    render: function() {
        return !this.props.link ?
            React.createElement("div", {className: "balloon--menu__element-container", onClick: this.props.onClick}, 
                React.createElement("div", {className: "balloon--menu__element"}, 
                    this.props.children
                )
            )
        :
            React.createElement("a", {href: this.props.link, className: "balloon--menu__element-container", onClick: this.props.onClick}, 
                React.createElement("div", {className: "balloon--menu__element"}, 
                    this.props.children
                )
            )
        ;
    }
});

var BlockList = React.createClass({displayName: "BlockList",
    prepareElements: function(elements){
        return elements.map(function(element){
            if (!_.isObject(element)){
                element = {
                    title: element,
                    data: element
                }
            }
            else if (!_.has(element, 'data')){
                element.data = element.title;
            }
            return element;
        });
    },
    getInitialState: function(){
        return {
            elements: this.prepareElements(this.props.elements)
        };
    },
    componentWillReceiveProps: function(nextProps){
        this.setState({elements: this.prepareElements(nextProps.elements)});
    },
    onElementClick: function(element){
        this.props.onElementClick(element.data);
    },
    render: function(){
        var that = this;
        return (
            React.createElement("div", {className: "block-list" + " " + (this.props.className ? this.props.className : "")}, 
                _.map(this.state.elements, function(element, i){
                    return React.createElement(BlockListElement, React.__spread({key: i},  element, {onClick: that.onElementClick.bind(that, element)}))
                })
            )
        );
    }
});

var BlockListElement = React.createClass({displayName: "BlockListElement",
    render: function(){
        var cx = React.addons.classSet;
        var classes = cx({
            "block-list__element": true,
            "block-list__element--clickable": this.props.clickable !== false && !this.props.open
        });
        return (
            React.createElement("div", {className: classes, onClick: this.props.onClick}, 
                React.createElement("div", {className: "block-list__element-title"}, this.props.title), 
                 this.props.note ?
                    React.createElement("div", {className: "block-list__element-note"}, this.props.note)
                : false
            )
        );
    }
});
var Checkbox = React.createClass({displayName: "Checkbox",
    mixins: [React.addons.PureRenderMixin],
    
    getInitialState: function(){
        return {
            checked: this.props.checked === true,
            focus: false
        };
    },
    componentWillReceiveProps: function(nextProps){
        if (_.has(nextProps, 'checked') && nextProps.checked !== this.state.checked){
            this.setState({checked: nextProps.checked});
        }
    },
    onContainerClick: function(event){
        var $target = $(event.target);
        if ($target.is('.checkbox__input') || $target.closest('.checkbox__description').length) return;

        this.onChange();
    },
    onChange: function(){
        var newState = !this.state.checked;
        this.setState({checked: newState});

        if (_.isFunction(this.props.onChange)){
            this.props.onChange(newState);
        }
    },
    onInputFocus: function(){
        this.setState({focus: true});
    },
    onInputBlur: function(){
        this.setState({focus: false});
    },
    render: function(){
        var cx = React.addons.classSet;
        var checkboxClasses = cx({
            'checkbox': true,
            'checkbox--biglabel': this.props.bigLabel,
            'checkbox--focus': this.state.focus,
            'checkbox--nolabel': !this.props.label,
            'checkbox--checked': this.state.checked,
            'checkbox--partially-checked': this.props.partiallyChecked
        });
        return (
            React.createElement("div", {className: checkboxClasses + " " + (this.props.className ? this.props.className : ""), onClick: this.onContainerClick}, 
                React.createElement("input", {type: "checkbox", className: "checkbox__input", checked: this.state.checked, onChange: this.onChange, onFocus: this.onInputFocus, onBlur: this.onInputBlur}), 
                React.createElement("div", {className: "checkbox__icon"}), 
                React.createElement("label", {className: "checkbox__text"}, this.props.label), 
                this.props.children
            )
        );
    }
});
var CheckboxButton = React.createClass({displayName: "CheckboxButton",
    mixins: [React.addons.PureRenderMixin],
    
    getInitialState: function(){
        return {
            checked: this.props.checked === true,
            focus: false
        };
    },
    componentWillReceiveProps: function(nextProps){
        if (_.has(nextProps, 'checked') && nextProps.checked !== this.state.checked){
            this.setState({checked: nextProps.checked});
        }
    },
    onContainerClick: function(event){
        this.onChange();
    },
    onChange: function(){
        var newState = !this.state.checked;
        if (!this.props.radio) {
            this.setState({checked: newState});
        }

        if (_.isFunction(this.props.onChange)){
            this.props.onChange(newState);
        }
    },
    onInputFocus: function(){
        this.setState({focus: true});
    },
    onInputBlur: function(){
        this.setState({focus: false});
    },
    render: function(){
        var cx = React.addons.classSet;
        var checkboxClasses = cx({
            'button': true,
            'button--small': true,
            'button--hover': this.state.focus,
            'button--selected': this.state.checked,
            'button--radio': this.props.radio
        });
        return (
            React.createElement("div", {className: checkboxClasses + " " + (this.props.className ? this.props.className : ""), onClick: this.onContainerClick}, 
                React.createElement("input", {type: "checkbox", className: "checkbox__input", checked: this.state.checked, onChange: this.onChange, onFocus: this.onInputFocus, onBlur: this.onInputBlur}), 
                React.createElement("span", null, this.props.label)
            )
        );
    }
});
var CheckboxesRow = React.createClass({displayName: "CheckboxesRow",
    getInitialState: function(){
        var checkedIndexes = [];
        _.each(this.props.elements, function(element, i){
            if (_.isObject(element) && element.checked){
                checkedIndexes.push(i);
            }
        });
        return {
            checkedIndexes: checkedIndexes
        };
    },
    componentWillReceiveProps: function(nextProps){
        if (this.props.elements !== nextProps.elements){
            var checkedIndexes = [];
            _.each(nextProps.elements, function(element, i){
                if (_.isObject(element) && element.checked){
                    checkedIndexes.push(i);
                }
            });

            this.setState({checkedIndexes: checkedIndexes});
        }
    },
    onCheckboxClick: function(data, index){
        var checkedIndexes = this.state.checkedIndexes;
        var arrayIndex = checkedIndexes.indexOf(index);
        var isChecked = arrayIndex !== -1;
        if (isChecked){
            checkedIndexes.splice(arrayIndex, 1);
        }
        else {
            checkedIndexes.push(index);
        }
        this.setState({checkedIndexes: checkedIndexes});

        if (_.isFunction(this.props.onCheckboxClick)){
            this.props.onCheckboxClick(data, !isChecked);
        }
    },
    render: function(){
        var that = this;
        var cx = React.addons.classSet;
        var rowClasses = cx({
            'checkboxes-row': true
        });
        return (
            React.createElement("div", {className: rowClasses + " " + (this.props.className ? this.props.className : "")}, 
                 this.props.label ?
                    React.createElement("label", {className: "input__title"}, this.props.label)
                : false, 
                _.map(this.props.elements, function(element, i){
                    var isObject = _.isObject(element);
                    var text = isObject ? element.text : element;
                    var retVal = isObject && element.data ? element.data : text;

                    var checkboxClasses = cx({
                        'row-checkbox': true,
                        'row-checkbox--checked': _.contains(that.state.checkedIndexes, i)
                    });

                    return React.createElement("div", {key: i, className: checkboxClasses, onClick: that.onCheckboxClick.bind(that, retVal, i)}, text)
                })
            )
        );
    }
});
var Dropdown = React.createClass({displayName: "Dropdown",
    prepareElements: function(elements){
        return elements.map(function(element){
            if (!_.isObject(element)){
                element = {
                    text: element,
                    data: element
                }
            }
            else if (!_.has(element, 'data')){
                element.data = element.text;
            }
            return element;
        });
    },
    getElementByData: function(elements, data){
        return _.find(elements, function(element){
            return _.isEqual(element.data, data);
        });
    },
    getInitialState: function(){
        var elements = this.prepareElements(this.props.elements);
        var value;

        if (_.has(this.props, 'value')){
            value = this.props.value;
        }
        else if (_.has(this.props, 'dataValue')){
            value = this.getElementByData(elements, this.props.dataValue);
            value = value && value.text;
        }
        else {
            value = "";
        }

        return {
            selectedIndex: null,
            elements: elements,
            open: this.props.open,
            value: value
        };
    },
    componentWillReceiveProps: function(nextProps){
        var elements = this.prepareElements(nextProps.elements);
        var value;

        if (_.has(this.props, 'value')){
            value = this.props.value;
        }
        else if (_.has(this.props, 'dataValue')){
            value = this.getElementByData(elements, nextProps.dataValue);
            value = value && value.text;
        }

        this.setState({
            value: value,
            elements: elements
        });
    },
    componentDidUpdate: function(prevProps, prevState) {
        var that = this;
        if (prevState.open !== this.state.open){
            if (this.state.open){
                this.enableDocumentListeners();
                setTimeout(function(){
                    that.show();
                },0);
            }
            else {
                this.disableDocumentListeners();
                this.hide();
            }
        }
    },
    onFocus: function(){
        this.show();
        if (_.isFunction(this.props.onFocus)){
            this.props.onFocus();
        }
    },
    show: function(){
        this.setState({
            selectedIndex: null,
            open: true
        });
    },
    hide: function(){
        this.setState({open: false});
    },
    onMouseDown: function(event){
        this.setState({open: !this.state.open});
    },
    enableDocumentListeners: function(){
        $(document).bind('click', this.handleDocumentClick);
        $(document).bind('keydown', this.handleDocumentKeydown);
    },
    disableDocumentListeners: function(){
        $(document).unbind('click', this.handleDocumentClick);
        $(document).unbind('keydown', this.handleDocumentKeydown);
    },
    componentWillUnmount: function(){
        this.disableDocumentListeners();
    },
    onElementHover: function(index){
        this.setState({selectedIndex: index});

        if (_.isFunction(this.props.onElementHover)){
            this.props.onElementHover(index);
        }
    },
    onElementSelect: function(data){
        //this.setState({value: text});
        this.hide();
        if (_.isFunction(this.props.onChange)){
            this.props.onChange(data);
        }
    },
    handleDocumentKeydown: function(event){
        var keyCode = event.keyCode;
        var maxIndex = this.props.elements.length - 1;
        var newIndex;
        var selectedIndex = this.state.selectedIndex;

        switch (keyCode){
            case 40:
                if (selectedIndex === null){
                    newIndex = 0;
                }
                else {
                    newIndex = selectedIndex >= maxIndex ? 0 : selectedIndex + 1;
                }
                this.setState({selectedIndex: newIndex});
                this.onElementHover(newIndex);
                event.preventDefault();
                break;
            case 38:
                newIndex = selectedIndex && selectedIndex <= maxIndex ? selectedIndex - 1 : maxIndex;
                this.setState({selectedIndex: newIndex});
                this.onElementHover(newIndex);
                event.preventDefault();
                break;
            case 13:
                if (this.state.selectedIndex === null){
                    if (_.isFunction(this.props.onHide)){
                        this.props.onHide();
                    }
                }
                else {
                    var element = this.props.elements[this.state.selectedIndex];
                    var isObject = _.isObject(element);
                    var text = isObject ? element.text : element;
                    var data = isObject && element.data ? element.data : text;

                    this.onElementSelect(text, data);
                }
                break;
            default:
                break;
        }
    },
    handleDocumentClick: function(event){
        if (!this.isMounted() || ($(event.target).closest($(this.getDOMNode())).length && !$(event.target).closest('.input__suggest__element').length)){
            return;
        }
        if (this.props.onHide){
            this.props.onHide();
            this.disableDocumentListeners();
        }
        else {
            this.disableDocumentListeners();
            this.setState({open: false});
        }
    },
    render: function() {
        var that = this;
        var cx = React.addons.classSet;
        var dropdownClasses = cx({
            'input': true,
            'input--dropdown': true,
            'input--focus': this.state.open,
            'input--disabled': this.props.disabled
        });
        return (
            React.createElement("div", {className: dropdownClasses + " " + (this.props.className ? this.props.className : ""), onMouseDown: this.onMouseDown}, 
                 this.props.label ?
                    React.createElement("label", {className: "input__title"}, this.props.label)
                : false, 
                React.createElement("div", {className: "input__dropdown-value"}, this.state.value), 
                React.createElement("input", {ref: "input", readOnly: true, value: this.state.value, onBlur: this.hide, onFocus: this.onFocus, placeholder: this.props.placeholder}), 
                React.createElement("div", {className: "input__dropdown-icon"}), 
                 this.state.open && React.createElement(DropdownElements, React.__spread({},  _.omit(this.props, "className"),  this.state, {onElementSelect: this.onElementSelect}))
            )
        );
    }
});
var DropdownElement = React.createClass({displayName: "DropdownElement",
    getInitialState: function(){
        return {
            value: this.getMatchedText(this.props.value, this.props.matchValue)
        };
    },
    componentWillReceiveProps: function(nextProps){
        this.setState({
            value: this.getMatchedText(nextProps.value, nextProps.matchValue)
        });
    },
    getMatchedText: function(value, matchValue){
        if (!matchValue) return value;

        var text = value;
        var matchText = matchValue;

        var lowerText = text.toLowerCase();
        var words = _.uniq(matchText.trim().replace(/\s+/g, ' ').toLowerCase().split(" "));
        var isMatch = _.every(words, function(word){
            return lowerText.indexOf(word) !== -1;
        });
        if (isMatch){
            _.each(words, function(word){
                var re = new RegExp('(' + word + ')', "gi");
                text = text.replace(re, '<span class="input__suggest__element__match">$1</span>');
            });
        }

        return text;
    },
    render: function(){
        var cx = React.addons.classSet;
        var elementClasses = cx({
            'input__suggest__element': true,
            'input__suggest__element--selected': this.props.hover
        });
        var value = this.state.value;
        if (this.props.note) {
            value += ("<div class=\"input__suggest__element-note\">" + this.props.note + "</div>");
        }
        return (
            React.createElement("div", {className: elementClasses, 
                onMouseDown: this.props.onSelect, 
                onMouseOver: this.props.onHover, 
                dangerouslySetInnerHTML: {__html: value}}
            )
        );
    }
});
var DropdownElements = React.createClass({displayName: "DropdownElements",
    getInitialState: function() {
        var $el = $("<div style='overflow: scroll; width: 50px'><div/></div>").appendTo("body");
        var browserScrollbarWidth = 50 - $el.children().width();
        $el.remove();
        return {
            selectedIndex: null,
            browserScrollbarWidth: browserScrollbarWidth
        };
    },
    componentWillReceiveProps: function(nextProps) {
        if (this.props.elements !== nextProps.elements) {
            this.onElementHover(null);
        }
    },
    componentDidMount: function() {
        this.enableDocumentListeners();
        var $list = $(this.refs.list.getDOMNode());
        var $wrapper = $(this.getDOMNode());
        $list.css({
            width: $wrapper.width() + this.state.browserScrollbarWidth
            //padding: 0
        });
        var scrollContainerHeight = $wrapper.height();
        var scrollContentHeight = $list[0].scrollHeight;
        this.setState({
            scrollContainerHeight: scrollContainerHeight,
            scrollContentHeight: scrollContentHeight,
            scrollable: scrollContainerHeight < scrollContentHeight
        });
    },
    componentWillUnmount: function() {
        this.disableDocumentListeners();
    },
    onSctollbarMouseDown: function(event) {
        this.setState({
            y: event.clientY,
            startScrollTop: this.refs.list.getDOMNode().scrollTop,
            scrollbarActive: true
        });
        $(document).unbind("mousemove", this.onSctollbarMouseMove);
        $(document).unbind("mouseup", this.onSctollbarMouseUp);
        $(document).bind("mousemove", this.onSctollbarMouseMove);
        $(document).bind("mouseup", this.onSctollbarMouseUp);
        event.preventDefault();
        event.stopPropagation();
    },
    onSctollbarMouseMove: function(event) {
        var y = event.clientY;

        var ratio = this.state.scrollContainerHeight / this.state.scrollContentHeight;
        var height = this.state.scrollContainerHeight * ratio;
        var heightDelta = 0;
        var minHeight = 20;
        if (height < minHeight) {
            heightDelta = minHeight - height;
            ratio = this.state.scrollContainerHeight / (this.state.scrollContentHeight + heightDelta / ratio);
        }
        var maxScroll = this.state.scrollContentHeight * ratio;

        var scrollTop = this.state.startScrollTop + (y - this.state.y) / ratio;
        var newState = {};
        this.refs.list.getDOMNode().scrollTop = scrollTop;
        newState.scrollTop = scrollTop;
        this.setState(newState);
        event.preventDefault();
    },
    onSctollbarMouseUp: function() {
        $(document).unbind("mousemove", this.onSctollbarMouseMove);
        $(document).unbind("mouseup", this.onSctollbarMouseUp);
        setTimeout(function()  {
            this.setState({scrollbarActive: false});
        }.bind(this), 0);
    },
    enableDocumentListeners: function() {
        $(document).bind("keydown", this.handleDocumentKeydown);
        $(document).bind("click", this.handleDocumentClick);
        if (this.refs.list) {
            $(this.refs.list.getDOMNode()).bind("scroll", this.onListScroll);
        }
    },
    disableDocumentListeners: function() {
        $(document).unbind("keydown", this.handleDocumentKeydown);
        $(document).bind("click", this.handleDocumentClick);
        if (this.refs.list) {
            $(this.refs.list.getDOMNode()).unbind("scroll", this.onListScroll);
        }
    },
    onListScroll: function(event) {
        var scrollTop = event.target.scrollTop;
        var ratio = this.state.scrollContainerHeight / this.state.scrollContentHeight;
        var height = this.state.scrollContainerHeight * ratio;
        var heightDelta = 0;
        var minHeight = 20;
        if (height < minHeight) {
            heightDelta = minHeight - height;
            ratio = this.state.scrollContainerHeight / (this.state.scrollContentHeight + heightDelta / ratio);
        }
        this.setState({scrollTop: event.target.scrollTop});
        this.refs.scrollbar.getDOMNode().style.top = this.state.scrollTop * ratio + "px";
    },
    onElementHover: function(index) {
        this.setState({selectedIndex: index});

        if (_.isFunction(this.props.onElementHover)) {
            this.props.onElementHover(index);
        }
    },
    onElementSelect: function(data) {
        if (_.isFunction(this.props.onElementSelect)) {
            this.props.onElementSelect(data);
        }
    },
    handleDocumentKeydown: function(event) {
        var keyCode = event.keyCode;
        var maxIndex = this.props.elements.length - 1;
        var newIndex;
        var selectedIndex = this.state.selectedIndex;

        switch (keyCode) {
            case 40:
                if (selectedIndex === null) {
                    newIndex = 0;
                }
                else {
                    newIndex = selectedIndex >= maxIndex ? 0 : selectedIndex + 1;
                }
                this.onElementHover(newIndex);
                break;
            case 38:
                newIndex = selectedIndex && selectedIndex <= maxIndex ? selectedIndex - 1 : maxIndex;
                this.onElementHover(newIndex);
                break;
            case 13:
                if (this.state.selectedIndex === null) {
                    if (_.isFunction(this.props.onHide)) {
                        this.props.onHide();
                    }
                }
                else {
                    var element = this.props.elements[this.state.selectedIndex];
                    var isObject = _.isObject(element);
                    var text = isObject ? element.text : element;
                    var data = isObject && element.data ? element.data : text;

                    this.onElementSelect(data);
                }
                break;
            default:
                break;
        }
    },
    handleDocumentClick: function(event) {
        if (!this.isMounted() || ($(event.target).closest($(this.getDOMNode()).parent()).length && !$(event.target).closest(".input__suggest__element").length)) {
            return;
        }
        if (this.state.scrollbarActive) {
            event.stopImmediatePropagation();
            return;
        }
        if (this.props.onHide) {
            this.props.onHide();
        }
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        var omitProps = _.omit(this.props, ["onHover", "onSelect"]);
        var omitNextProps = _.omit(nextProps, ["onHover", "onSelect"]);
        var omitState = _.omit(this.state, ["scrollTop", "startScrollTop", "y"]);
        var omitNextState = _.omit(nextState, ["scrollTop", "startScrollTop", "y"]);

        return !_.isEqual(omitProps, omitNextProps) || !_.isEqual(omitState, omitNextState);
    },
    render: function() {
        var that = this;
        var cx = React.addons.classSet;
        var suggestWrapperClasses = cx({
            "input__suggest-wrapper": true,
            "input__suggest-wrapper--scrollable": this.state.scrollable
        });

        var ratio = this.state.scrollContainerHeight / this.state.scrollContentHeight;
        var height = this.state.scrollContainerHeight * ratio;
        var heightDelta = 0;
        var minHeight = 20;
        if (height < minHeight) {
            height = minHeight;
        }

        var scrollbarStyle = {
            height: height + "px"
        };

        var scrollbarClasses = cx({
            "input__suggest-scrollbar": true,
            "input__suggest-scrollbar--active": this.state.scrollbarActive
        });
        return (
            React.createElement("div", {className: suggestWrapperClasses + " " + (this.props.className ? this.props.className : "")}, 
                React.createElement("div", {ref: "list", className: "input__suggest"}, 
                    _.map(this.props.elements, function(element, i) {
                        var isObject = _.isObject(element);
                        var text = isObject ? element.text : element;
                        var note = isObject && element.note;
                        var retVal = isObject && element.data ? element.data : text;
                        var isHovered = i === that.state.selectedIndex;

                        var onSelect = function() {
                            that.onElementSelect(retVal);
                        };
                        var onHover = function() {
                            that.onElementHover(i);
                        };

                        return React.createElement(DropdownElement, {
                                key: i, 
                                onSelect: onSelect, 
                                value: text, 
                                note: note, 
                                matchValue: element.match !== false && that.props.matchValue, 
                                hover: isHovered, 
                                onHover: onHover}
                               );
                    })
                ), 
                 this.state.scrollable && React.createElement("div", {style: scrollbarStyle, ref: "scrollbar", className: scrollbarClasses, onMouseDown: this.onSctollbarMouseDown})
            )
        );
    }
});

var EditableTitle = React.createClass({displayName: "EditableTitle",
    mixins: [React.addons.LinkedStateMixin],

    getInitialState: function(){
        return {
            value: this.props.value,
            editing: false,
            editable: this.props.editable !== false
        };
    },
    componentWillUnmount: function(){
        $(document).unbind('click', this.onDocumentClick);
    },
    componentWillReceiveProps: function(nextProps){
        var editing = _.has(nextProps, 'editing') ? nextProps.editing : this.state.editing;

        this.setState({
            value: nextProps.value,
            editable: nextProps.editable !== false,
            editing: editing
        }, function()  {
            if (!editing && this.state.editing){
                this.onSave();
            }
        }.bind(this));
    },
    componentWillUpdate: function(nextProps, nextState){
        if (nextState.editing){
            $(document).bind('click', this.onDocumentClick);
        }
        else {
            $(document).unbind('click', this.onDocumentClick);
        }
    },
    componentDidUpdate: function(prevProps, prevState){
        if (!prevState.editing && this.state.editing){
            var input = this.refs.input.getDOMNode();
            var len = this.state.value.length;
            input.focus();
            input.setSelectionRange(len, len);
        }
    },
    onDocumentClick: function(event){
        if (!this.state.editing) {
            return;
        }

        var inputElement = this.refs.input && this.refs.input.getDOMNode();
        var valueElement = this.refs.value && this.refs.value.getDOMNode();
        var $target = $(event.target);

        if ($target.is(inputElement) || $target.is(valueElement)){
            return;
        }

        this.onSave(event);
    },
    onKeyDown: function(event){
        switch (event.key){
            case "Enter":
                this.onSave(event);
                break;
            case "Escape":
                this.onCancel(event);
                break;
            case "Tab":
                event.preventDefault();
                break;
            default:
                break;
        }
    },
    onSave: function(event){
        if (!this.state.value){
            this.onCancel();
            return;
        }

        if (!_.has(this.props, 'editing')) {
            this.setState({editing: false});
        }

        if (_.isFunction(this.props.onChange)){
            this.props.onChange(this.state.value, event);
        }
    },
    onCancel: function(event){
        this.setState({
            editing: false,
            value: this.props.value
        });

        if (_.isFunction(this.props.onChange)){
            this.props.onChange(this.props.value, event);
        }
    },
    onClick: function(){
        if (this.state.editable && !isMobileDevice()){
            this.setState({editing: true});
            if (_.isFunction(this.props.onFocus)){
                this.props.onFocus();
            }
        }
    },
    render: function(){
        var isEditing = this.state.editing;
        var cx = React.addons.classSet;
        var classes = cx({
            'editable-title': true,
            'editable-title--editing': isEditing
        });
        return (
            React.createElement("div", {className: classes + " " + (this.props.className || "")}, 
                React.createElement("input", {autoComplete: "off", ref: "input", className: "editable-title__input", valueLink: this.linkState('value'), onKeyDown: this.onKeyDown, onBlur: this.onSave}), 
                React.createElement("span", {ref: "value", className: "editable-title__value", onClick: this.onClick}, this.state.value)
            )
        )
    }
});
var FormRow = React.createClass({displayName: "FormRow",
    render: function(){
        var cx = React.addons.classSet;
        var classes = cx({
            'form-row': true,
            'form-row--paddless-inside': this.props.paddlessInside,
            'form-row--paddless-outside': this.props.paddlessOutside,
            'form-row--removeable': this.props.removeable
        });
        return (
            React.createElement("div", {className: classes + " " + (this.props.className ? this.props.className : "")}, 
                 this.props.label ?
                    React.createElement("div", {className: "input__title form-row__title"}, this.props.label)
                : false, 
                this.props.children, 
                 this.props.removeable ?
                    React.createElement("div", {className: "form-row__btn-remove close-button", onClick: this.props.onRemove})
                : false
            )
        );
    }
});
var Input = React.createClass({displayName: "Input",
    getAcceptedChars: function(acceptedChars) {
        if (this.props.type === "price") {
            acceptedChars = ["digits", ",", "."];
        }
        if (acceptedChars) {
            acceptedChars = _.chain(acceptedChars)
                             .map(function(chr) {
                                 if (chr === "digits") {
                                     chr = ["0-9"];
                                 }
                                 if (chr === "latin") {
                                     chr = ["A-z"];
                                 }
                                 return chr;
                             })
                             .flatten()
                             .value();

            //var escapedChars = acceptedChars.join().replace(\(\.|\^|\$|\*|\+|\?|\(|\)|\[|\{|\\|\|)\g, "\\$1");
            var reString = "[^" + acceptedChars.join("").replace(/(.)/g, "\$1") + "]";
            acceptedChars = {
                chars: acceptedChars,
                test: function(str) {
                    var re = new RegExp(reString);
                    return !re.test(str);
                },
                replace: function(str) {
                    var re = new RegExp(reString, "g");
                    return str.replace(re, "");
                }
            };

            return acceptedChars;
        }
    },
    getInitialState: function() {
        return {
            focus: false,
            paddingLeft: 0,
            acceptedChars: this.getAcceptedChars(this.props.acceptedChars)
        };
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({acceptedChars: this.getAcceptedChars(nextProps.acceptedChars)});
    },
    componentDidMount: function() {
        var input = this.refs.input.getDOMNode();
        if (this.props.unit) {
            var $input = $(input);
            var $unit = $(this.refs.unit.getDOMNode());

            var newPadding = parseInt($input.css("padding-right")) + $unit.outerWidth();
            $input.css("padding-right", newPadding);
        }
        //if (!Modernizr.input.placeholder) {
            // IE8 may not fire focus/blur events without that
            $(input).on("focus", function() {});
            $(input).on("blur", function() {});

            this.setState({
                paddingLeft: parseInt($(input).css("padding-left")) + 1
            });
        //}
    },
    getInputCursorPosition: function() {
        var input = this.refs.input.getDOMNode();
        var pos = 0;

        if (document.selection) {
            input.focus();
            var sel = document.selection.createRange();
            sel.moveStart("character", -input.value.length);
            pos = sel.text.length;
        }
        else if (_.isNumber(input.selectionStart)) {
            pos = input.selectionStart;
        }

        return pos;
    },
    onFocus: function() {
        this.setState({focus: true});
        if (_.isFunction(this.props.onFocus)) {
            this.props.onFocus();
        }
    },
    onBlur: function() {
        this.setState({focus: false});
        if (_.isFunction(this.props.onBlur)) {
            this.props.onBlur();
        }
    },
    onClick: function() {
        this.refs.input.getDOMNode().focus();
        this.setState({focus: true});
    },
    onKeyDown: function(event) {
        if (event.key === "Enter") {
            if (_.isFunction(this.props.onEnterPress)) {
                this.props.onEnterPress();
            }
            if (this.props.search) {
                this.onSearch(event.target.value);
            }
        }
        if (event.key === "Escape") {
            if (_.isFunction(this.props.onEscPress)) {
                this.props.onEscPress();
            }
        }
        if (_.isFunction(this.props.onKeyDown)) {
            this.props.onKeyDown();
        }
    },
    onKeyPress: function(event) {
        if (this.state.acceptedChars && !this.state.acceptedChars.test(event.key)) {
            event.preventDefault();
        }
    },
    setCaretPos: function(pos) {
        var input;
        var setPos = function() {
            if ("selectionStart" in input && "selectionEnd" in input) {
                input.selectionStart = input.selectionEnd = pos;
            }
            else if ("setSelectionRange" in input) {
                input.setSelectionRange(pos, pos);
            }
            else {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveStart("character", pos);
                range.moveEnd("character", 0);
                range.select();
            }
        };

        if (this.isMounted()) {
            input = this.refs.input.getDOMNode();
            setPos();
            setTimeout(setPos, 0);
        }
    },
    onChange: function(event) {
        if (this.state.acceptedChars) {
            var input = event.target;
            var cursorPos = this.getInputCursorPosition();
            if (this.props.type === "price") {
                event.target.value = event.target.value.replace(/[^0-9,\,,\.]/g, "").replace(/(,|\.)+([0-9]{0,2}).*$/, ",$2").replace(/^0+/, "");
                if (/^,/.test(event.target.value)) {
                    event.target.value = event.target.value.replace(/^,/, "0,");
                    cursorPos++;
                }
            }
            else {
                event.target.value = this.state.acceptedChars.replace(event.target.value);
            }
            this.setCaretPos(cursorPos);
        }
        if (this.props.type === "date") {
            event.target.value = event.target.value.substr(0, 10);
        }
        if (this.props.onChange) {
            this.props.onChange(event.target.value, event);
        }
    },
    onSearch: function() {
        if (_.isFunction(this.props.onSearch)) {
            this.props.onSearch(this.refs.input.getDOMNode().value);
        }
    },
    onShowPasswordClick: function() {
        this.setState({showPassword: !this.state.showPassword});
    },
    render: function() {
        var isPassword = this.props.type === "password";
        var isDatepicker = this.props.type === "datepicker";
        var isLoading = this.props.loading;
        var cx = React.addons.classSet;
        var inputClasses = cx({
            "input": true,
            "input--focus": this.state.focus && !this.props.disabled,
            "input--label-right": this.props.labelRight,
            "input--label-light": this.props.labelLight,
            "input--invalid": this.props.invalid,
            "input--disabled": this.props.disabled,
            "input--search": !isLoading && this.props.search,
            "input--loading": isLoading,
            "input--datepicker": isDatepicker
        });
        var titleClasses = cx({
            "input__title": true
        });
        var mask = this.props.mask || (this.props.type === "date" && "99.99.9999");
        var type = (this.props.type !== "date" && this.props.type) || "text";
        var unit = this.props.unit;
        if ((!this.props.type && _.isEqual(this.props.acceptedChars, ["digits"])) || this.props.type === "date" || isDatepicker) {
            type = "tel";
        }
        else if ((type === "password" && this.state.showPassword) || type === "price") {
            if (type === "price" && !_.has(this.props, "unit")) {
                //unit = "руб.";
            }
            type = "text";
        }
        var showPlaceholder = /*!Modernizr.input.placeholder && */!!this.props.placeholder && !this.props.value;
        return (
            React.createElement("div", {onClick: this.onClick, className: inputClasses + " " + (this.props.className ? this.props.className : "")}, 
                 this.props.label ?
                    React.createElement("label", {className: titleClasses}, this.props.label)
                : false, 
                 !!unit && React.createElement("div", {ref: "unit", className: "input__unit"}, unit), 
                 showPlaceholder && React.createElement("div", {ref: "placeholder", className: "input__placeholder", style: {paddingLeft: this.state.paddingLeft}}, this.props.placeholder), 
                React.createElement(InputElement, {type: type, readOnly: this.props.disabled, ref: "input", value: this.props.value, onFocus: this.onFocus, onBlur: this.onBlur, onChange: this.props.valueLink ? null : this.onChange, onKeyPress: this.onKeyPress, valueLink: this.props.valueLink, placeholder: "", /*this.props.placeholder*/onKeyDown: this.onKeyDown, mask: mask, maxLength: this.props.maxLength}), 
                 !isLoading && this.props.search && React.createElement("div", {className: "input__btn-search", onClick: this.onSearch}), 
                 isLoading && React.createElement("div", {className: "input__loading-icon"}), 
                 this.props.children, 
                 this.props.invalid && this.props.errorMessage && React.createElement(InputErrorMessage, null, this.props.errorMessage)
            )
        );
    }
});

var InputErrorMessage = React.createClass({displayName: "InputErrorMessage",
    render: function() {
        return React.createElement("div", {className: "input__error-message"}, this.props.children);
    }
});

// https://github.com/sanniassin/react-input-mask

var InputElement = React.createClass({displayName: "InputElement",
    charsRules: {
        "9": "[0-9]",
        "a": "[A-Za-z]",
        "*": "[A-Za-z0-9]"
    },
    defaultMaskChar: "_",
    getPrefix: function() {
        var prefix = "";
        var mask = this.state.mask;
        for (var i = 0; i < mask.length && this.isPermanentChar(i); ++i) {
            prefix += mask[i];
        }
        return prefix;
    },
    getFilledLength: function() {
        var value = this.state.value;
        var maskChar = this.state.maskChar;

        for (var i = value.length - 1; i >= 0; --i) {
            var char = value[i];
            if (!this.isPermanentChar(i) && this.isAllowedChar(char, i)) {
                break;
            }
        }

        return ++i || this.getPrefix().length;
    },
    getLeftEditablePos: function(pos) {
        for (var i = pos; i >= 0; --i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    getRightEditablePos: function(pos) {
        var mask = this.state.mask;
        for (var i = pos; i < mask.length; ++i) {
            if (!this.isPermanentChar(i)) {
                return i;
            }
        }
        return null;
    },
    isEmpty: function(value) {
        return !value.split("").some(function(char, i) 
            {return !this.isPermanentChar(i) && this.isAllowedChar(char, i);}.bind(this)
        );
    },
    formatValue: function(value, newState) {
        var $__0=     newState || this.state,maskChar=$__0.maskChar,mask=$__0.mask;
        return value.split("")
                    .concat(Array.apply(null, Array(mask.length - value.length)))
                    .map(function(char, pos)  {
                        if (this.isAllowedChar(char, pos, newState)) {
                            return char;
                        }
                        else if (this.isPermanentChar(pos, newState)) {
                            return mask[pos];
                        }
                        return maskChar;
                    }.bind(this))
                    .join("");
    },
    clearRange: function(value, start, len) {
        var maskChar = this.state.maskChar;
        var mask = this.state.mask;
        var end = start + len;
        return value.split("")
                    .map(function(char, i)  {
                        if (i < start || i >= end) {
                            return char;
                        }
                        if (this.isPermanentChar(i)) {
                            return mask[i];
                        }
                        return maskChar;
                    }.bind(this))
                    .join("");
    },
    replaceSubstr: function(value, newSubstr, pos) {
        return value.slice(0, pos) + newSubstr + value.slice(pos + newSubstr.length);
    },
    isAllowedChar: function(char, pos, newState) {
        var mask = newState ? newState.mask : this.state.mask;
        if (this.isPermanentChar(pos, newState)) {
            return mask[pos] === char;
        }
        var ruleChar = mask[pos];
        var charRule = this.charsRules[ruleChar];
        return (new RegExp(charRule)).test(char || "");
    },
    isPermanentChar: function(pos, newState) {
        var permanents = newState ? newState.permanents : this.state.permanents;
        return permanents.indexOf(pos) !== -1;
    },
    setCaretToEnd: function() {
        var value = this.state.value;
        var maskChar = this.state.maskChar;
        var prefixLen = this.getPrefix().length;
        for (var i = value.length - 1; i >= 0; --i) {
            if (!this.isPermanentChar(i) && value[i] !== maskChar || i < prefixLen) {
                this.setCaretPos(i + 1);
                return;
            }
        }
        if (value.length && value[0] === maskChar) {
            this.setCaretPos(0);
        }
    },
    getSelection: function() {
        var input = this.getDOMNode();
        var start = 0;
        var end = 0;

        if ("selectionStart" in input && "selectionEnd" in input) {
            start = input.selectionStart;
            end = input.selectionEnd;
        }
        else {
            var range = document.selection.createRange();
            var len = input.value.length;

            var inputRange = input.createTextRange();
            inputRange.moveToBookmark(range.getBookmark());

            start = -inputRange.moveStart("character", -len);
            end = -inputRange.moveEnd("character", -len);
        }

        return {
            start: start,
            end: end,
            length: end - start
        };
    },
    getCaretPos: function() {
        var input = this.getDOMNode();
        var pos = 0;

        if ("selectionStart" in input) {
            pos = input.selectionStart;
        }
        else {
            var range = document.selection.createRange();
            range.moveStart("character", -input.value.length);
            pos = range.text.length;
        }

        return pos;
    },
    setCaretPos: function(pos) {
        var input;
        var setPos = function() {
            if ("selectionStart" in input && "selectionEnd" in input) {
                input.selectionStart = input.selectionEnd = pos;
            }
            else if ("setSelectionRange" in input) {
                input.setSelectionRange(pos, pos);
            }
            else {
                var inputRange = input.createTextRange();
                inputRange.collapse(true);
                inputRange.moveStart("character", pos);
                inputRange.moveEnd("character", 0);
                inputRange.select();
            }
        };

        if (this.isMounted()) {
            input = this.getDOMNode();
            setPos();
            setTimeout(setPos, 0);
        }
    },
    isFocused: function() {
        return document.activeElement === this.getDOMNode();
    },
    parseMask: function(mask) {
        if (typeof mask !== "string") {
            return {
                mask: null,
                permanents: []
            };
        }
        var str = "";
        var permanents = [];
        var isPermanent = false;

        mask.split("").forEach(function(char)  {
            if (!isPermanent && char === "\\") {
                isPermanent = true;
            }
            else {
                if (isPermanent || !this.charsRules[char]) {
                    permanents.push(str.length);
                }
                str += char;
                isPermanent = false;
            }
        }.bind(this));

        return {
            mask: str,
            permanents: permanents
        };
    },
    getStringValue: function(value) {
        return !value && value !== 0 ? "" : value + "";
    },
    getInitialState: function() {
        var mask = this.parseMask(this.props.mask);
        return {
            mask: mask.mask,
            permanents: mask.permanents,
            value: this.getStringValue(this.props.value),
            maskChar: typeof this.props.maskChar === "string" ? this.props.maskChar : this.defaultMaskChar
        };
    },
    componentWillMount: function() {
        if (this.state.mask && this.state.value) {
            this.setState({
                value: this.formatValue(this.state.value)
            });
        }
    },
    componentWillReceiveProps: function(nextProps) {
        var mask = this.parseMask(nextProps.mask);
        var maskChar = typeof this.props.maskChar === "string" ? nextProps.maskChar : this.defaultMaskChar;
        var state = {
            mask: mask.mask,
            permanents: mask.permanents,
            maskChar: maskChar
        };
        var newValue = this.getStringValue(nextProps.value);
        if (mask.mask && (newValue || this.isFocused())) {
            newValue = this.formatValue(newValue, state);
        }
        if (this.state.value !== newValue) {
            state.value = newValue;
        }
        this.setState(state);
    },
    onKeyDown: function(event) {
        var hasHandler = typeof this.props.onKeyDown === "function";
        if (event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyDown(event);
            }
            return;
        }

        var caretPos = this.getCaretPos();
        var value = this.state.value;
        var key = event.key;
        var preventDefault = false;
        var maskChar = this.state.maskChar;
        switch (key) {
            case "Backspace":
            case "Delete":
                var prefixLen = this.getPrefix().length;
                var deleteFromRight = key === "Delete";
                var selectionRange = this.getSelection();
                if (selectionRange.length) {
                    value = this.clearRange(value, selectionRange.start, selectionRange.length);
                }
                else if (caretPos < prefixLen || (!deleteFromRight && caretPos === prefixLen)) {
                    caretPos = prefixLen;
                }
                else {
                    var editablePos = deleteFromRight ? this.getRightEditablePos(caretPos) : this.getLeftEditablePos(caretPos - 1);
                    if (editablePos !== null) {
                        value = this.replaceSubstr(value, maskChar, editablePos);
                        caretPos = editablePos;
                    }
                }
                preventDefault = true;
                break;
            default:
                break;
        }

        if (hasHandler) {
            this.props.onKeyDown(event);
        }

        if (value !== this.state.value) {
            event.target.value = value;
            this.setState({
                value: value
            });
            preventDefault = true;
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        if (preventDefault) {
            event.preventDefault();
            this.setCaretPos(caretPos);
        }
    },
    onKeyPress: function(event) {
        var key = event.key;
        var hasHandler = typeof this.props.onKeyPress === "function";
        if (key === "Enter" || event.ctrlKey || event.metaKey) {
            if (hasHandler) {
                this.props.onKeyPress(event);
            }
            return;
        }

        var caretPos = this.getCaretPos();
        var value = this.state.value;
        var maskLen = this.state.mask.length;
        var mask = this.state.mask;
        var prefixLen = this.getPrefix().length;

        if (this.isPermanentChar(caretPos) && mask[caretPos] === key) {
            ++caretPos;
        }
        else {
            var editablePos = this.getRightEditablePos(caretPos);
            if (editablePos !== null && this.isAllowedChar(key, editablePos)) {
                value = this.replaceSubstr(value, key, editablePos);
                caretPos = editablePos + 1;
            }
        }

        if (value !== this.state.value) {
            event.target.value = value;
            this.setState({
                value: value
            });
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        event.preventDefault();
        while (caretPos > prefixLen && this.isPermanentChar(caretPos)) {
            ++caretPos;
        }
        this.setCaretPos(caretPos);
    },
    onChange: function(event) {
        var maskLen = this.state.mask.length;
        var target = event.target;
        var value = target.value;
        if (value.length > maskLen) {
            value = value.substr(0, maskLen);
        }
        target.value = this.formatValue(value);
        this.setState({
            value: target.value
        });

        if (typeof this.props.onChange === "function") {
            this.props.onChange(event);
        }
    },
    onFocus: function(event) {
        if (!this.state.value) {
            var prefix = this.getPrefix();
            var value = this.formatValue(prefix);
            event.target.value = this.formatValue(value);
            this.setState({
                value: value
            }, this.setCaretToEnd);

            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }
        else if (this.getFilledLength() < this.state.mask.length) {
            this.setCaretToEnd();
        }

        if (typeof this.props.onFocus === "function") {
            this.props.onFocus(event);
        }
    },
    onBlur: function(event) {
        if (this.isEmpty(this.state.value)) {
            event.target.value = "";
            this.setState({
                value: ""
            });
            if (typeof this.props.onChange === "function") {
                this.props.onChange(event);
            }
        }

        if (typeof this.props.onBlur === "function") {
            this.props.onBlur(event);
        }
    },
    onPaste: function(event) {
        var text;
        if (window.clipboardData && window.clipboardData.getData) { // IE
            text = window.clipboardData.getData("Text");
        }
        else if (event.clipboardData && event.clipboardData.getData) {
            text = event.clipboardData.getData("text/plain");
        }
        if (text) {
            text = text.split("");
            var caretPos = this.getCaretPos();
            var value = this.state.value;
            var mask = this.state.mask;
            for (var i = caretPos; i < value.length && text.length; ) {
                if (!this.isPermanentChar(i) || mask[i] === text[0]) {
                    var char = text.shift();
                    if (this.isAllowedChar(char, i)) {
                        value = this.replaceSubstr(value, char, i);
                        ++i;
                    }
                }
                else {
                    ++i;
                }
            }
            if (value !== this.state.value) {
                event.target.value = value;
                this.setState({
                    value: value
                });
                if (typeof this.props.onChange === "function") {
                    this.props.onChange(event);
                }
            }
            this.setCaretPos(i);
        }
        event.preventDefault();
    },
    render: function() {
        var handlersContainer = this.state.mask ? this : this.props;
        var handlersKeys = ["onFocus", "onBlur", "onChange", "onKeyDown", "onKeyPress", "onPaste"];
        var handlers = {};
        handlersKeys.forEach(function(key)  {
            handlers[key] = handlersContainer[key];
        });
        return React.createElement("input", React.__spread({},  this.props,  handlers, {value: this.state.value}));
    }
});

var InputGroup = React.createClass({displayName: "InputGroup",
    getInitialState: function(){
        var childs = [];
        React.Children.forEach(this.props.children, function(children){
            childs.push(children);
        });

        return {
            childs: childs
        };
    },
    componentWillReceiveProps: function(nextProps){
        if (this.props.children !== nextProps.children){
            var childs = [];
            React.Children.forEach(nextProps.children, function(children){
                childs.push(children);
            });

            this.setState({childs: childs});
        }
    },
    render: function(){
        var childs = this.state.childs;
        var childIndex = 0;
        var elementIndex = 0;
        var glue = this.props.glue;

        var content = [];

        while (childIndex < childs.length){
            var child = childs[childIndex++];
            child.key = elementIndex++;
            content.push(child);
            if (glue && childIndex < childs.length){
                content.push(
                    React.createElement("span", {key: elementIndex++, className: "input-group__glue"}, glue)
                );
            }
        }

        return (
            React.createElement("div", {className: "input-group"}, 
                content
            )
        );
    }
});
var RadioButton = React.createClass({displayName: "RadioButton",
    onClick: function(){
        if (this.props.inRadioButtonGroup){
            this.props.onClick(this._currentElement, this.props._onClick);
        }
        else {
            this.props.onClick();
        }
    },
    render: function(){
        var cx = React.addons.classSet;
        var radioButtonClasses = cx({
            'radio-button': true,
            'radio-button--checked': this.props.checked
        });
        return (
            React.createElement("div", {className: radioButtonClasses + " " + (this.props.className ? this.props.className : ""), onClick: this.onClick}, 
                React.createElement("div", {className: "radio-button__icon"}), 
                React.createElement("label", {className: "radio-button__label"}, this.props.label)
            )
        );
    }
});
var RadioButtonGroup = React.createClass({displayName: "RadioButtonGroup",
    getInitialState: function(){
        return {
            checkedButton: null
        };
    },
    onClick: function(child, onClick){
        this.setState({checkedButton: child});
        onClick();
    },
    render: function(){
        var that = this;
        var processChild = function(child){
            if (_.isArray(child)){
                return React.Children.map(child, processChild);
            }
            if (child.type.displayName === "RadioButton"){
                if (child.props.onClick){
                    child.props._onClick = child.props.onClick;
                    child.props.onClick = that.onClick;
                }
                child.props.checked = that.state.checkedButton === child;
                child.props.inRadioButtonGroup = true;
            }
            var children = child.props.children;
            if (children){
                if (_.isArray(children)){
                    React.Children.map(children, processChild);
                }
                else {
                    processChild(children);
                }
            }
        };

        processChild(this.props.children);

        return (
            React.createElement("div", {className: "radio-button-group"}, 
                this.props.children
            )
        );
    }
});