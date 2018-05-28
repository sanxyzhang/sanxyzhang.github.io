$(function(){

	var WIN = window;
	    DOC = document,
		ACTIVE = "active",
	    J_LoadNum = $(".J_LoadNum"),
		J_ProgressContent = $(".J_ProgressContent"),
		Page_0 = $(".J_Page0"),
		Page_1 = $(".J_Page1"),
		Page_2 = $(".J_Page2"),
		J_OpenLight = $(".J_OpenLight");
        book=$(".bookbuttton")[0];
	// page0
	var lazyLoad = function() {
		$.ajax({
			url: "./../js/data.js",
			type: "get",
			success: function(data) {
				var imgData = JSON.parse(data);
				var len = imgData.length;
				var imgArr = [],
				    loadingNum = 0;
					actH5();
				var loadStyle = function(url) {
					var link = document.createElement("link");
					link.rel = "stylesheet";
					link.type = "text/css";
					link.href = url;
					var head = document.getElementsByTagName("head")[0];
					head.appendChild(link)
				};
				var loadingAct = function(num) {
					var percentNum = parseInt(num / len * 100);
					if (num === len) {
						J_ProgressContent.addClass(ACTIVE);
					}
					J_LoadNum.text(percentNum);
					J_ProgressContent.css('width',percentNum + '%');

					if (num === len) {
						J_ProgressContent.addClass(ACTIVE);
						loadStyle("../stylesheets/style.css");
						var timer = setTimeout(function() {
							var imgs = $("body img");
							imgs.each(function(index, item) {
								$(item).data("src") && $(item).attr("src", $(item).data("src"))
							});
							actH5();
							clearTimeout(timer)
						},600)
					}

				};
				for (var i = 0; i < len; i++) {
					imgArr.push(new Image());
					imgArr[i].src = imgData[i]
				}
				for (var j = 0; j < len; j++) {
					imgArr[j].onload = function() {
						loadingNum++;
						loadingAct(loadingNum)
					};
					imgArr[j].onerror = function() {
						loadingNum++;
						loadingAct(loadingNum)
					}
				}
			}
		})
	};
	lazyLoad();

	var actH5 = function(){
		showPage1();
	};

	//开关背景音乐
	document.addEventListener("WeixinJSBridgeReady",function() {
		var audio = $(".J_Music")[0];
		audio.play();
		originPlayMusic = false;
	},false)

	var playMusic = true,
	    audio = $(".J_Music")[0];
	$(".J_Audio").on('click',function(){
		if (playMusic) {
			$(this).removeClass(ACTIVE);
			audio.pause();
			
			playMusic = false
		} else {
			$(this).addClass(ACTIVE);
			audio.play();
			playMusic = true
		}
	});
	$(".bookbutton").on('click',function(){
		showPage1();
	})

	// page1
	J_OpenLight.on('click',function(){
		showPage2();
	})

	var showPage1 = function(){
		Page_0.hide();
		Page_1.show();
	}

	// page2
	var showPage2 = function(){
		Page_1.hide();
		Page_2.show();
		$(".J_BlackBg").addClass("active");
		$(".J_Page2Bar").addClass("active");
		setTimeout(function(){
			$(".J_Page2Title").removeClass("active");
		},1200);
	}

	//打开活动规则
	$(".J_Pge2ActiveRule").on('click',function(){
		$(".J_Opacity,.J_PageRule").show();		
	})

	//关闭活动规则
	$(".J_CloseRule").on('click',function(){
		$(".J_Opacity,.J_PageRule").hide();			
	})

	//活动规则下滑
	$.fn.scrollTo =function(options){
        var defaults = {
            toT : 0,    //滚动目标位置
            durTime : 500,  //过渡动画时间
            delay : 30,     //定时器时间
            callback:null   //回调函数
        };
        var opts = $.extend(defaults,options),
            timer = null,
            _this = this,
            curTop = _this.scrollTop(),//滚动条当前的位置
            subTop = opts.toT - curTop,    //滚动条目标位置和当前位置的差值
            index = 0,
            dur = Math.round(opts.durTime / opts.delay),
            smoothScroll = function(t){
                index++;
                var per = Math.round(subTop/dur);
                if(index >= dur){
                    _this.scrollTop(t);
                    window.clearInterval(timer);
                    if(opts.callback && typeof opts.callback == 'function'){
                        opts.callback(); 
                    }
                    return;
                }else{
                    _this.scrollTop(curTop + index*per);
                }
            };
        timer = window.setInterval(function(){
            smoothScroll(opts.toT);
        }, opts.delay);
        return _this;
    };

	$(".down-icons").on('click',function(){
		var curTop = $(".ruleInner").scrollTop();
		$(".ruleInner").scrollTo({toT: curTop+268});
	})


	// 打开引言
	var dOpen = !1;
	$(".J_Page2Btn").on('click',function(){
		$(".J_Opacity,.J_PageForeword").show();	
		var i = ["阅读是精神上的旅行","随时随地，你都可以出发", "为什么不在旅途中尝试一下呢", "远离地表的繁杂喧嚣","行在白云间","魂在书香里","点亮小小的阅读灯","让心灵和身体都在路上","愿你与最初的自己","久别重逢"],
			o = 0,
			n = 1,
			t = 83,
			a = .05;
		$(".introduction-content div").text("");
		var r = function d() {
			if (dOpen) {
				return o >= i.length ? (console.info("end"), $(".J_IntroductionBtn").addClass(ACTIVE), !1) : ($(".intr-word" + (o + 1)).text(i[o].substr(0, n)),
				 n++, 
				 n > i[o].length && (o++, n = 1), 
				setTimeout(function() {
					d()
				},50))
			}
		};	
		dOpen = !0;
		r();
	})

	//关闭引言
	$(".J_CloseForeword").on('click',function(){
		$(".J_Opacity,.J_PageForeword").hide();	
		$(".J_IntroductionBtn").removeClass(ACTIVE);
		dOpen = !1;
	})

	//打开名言页
	$(".J_IntroductionBtn").on('click',function(){
		$(".J_PageForeword").hide();	
		$(".J_PageNote").show();
	})

	// 切换名言 
	var chooseNum = 0,
		count = 9;
	var originalArray=new Array;//原数组
	for (var i=0;i<count;i++){ 
		originalArray[i]=i; 
	} 
	originalArray.sort(function(){ return 0.5 - Math.random(); }); 

	function changeNote(){
		$.ajax({
			url: './../js/note.js',
			type: 'get',
			dataType:'json',
			success: function(data){
				var randomNum = 1;
				if (chooseNum == 9) {
					chooseNum = 0;
				}

				$(".J_NoteWord").text(data[originalArray[chooseNum]].note);
				$(".J_Abstract").text(data[originalArray[chooseNum]].abstract);

				chooseNum ++;
			}
		})
	}
	changeNote();

	$(".J_CreatRefresh").click(function(){
		changeNote();
	})

	//打开海报页
	$(".J_CreatPoster").on('click',function(){
		$(".J_PagePoster").show();
		showPoster();
	})

	//海报页面
	function iosMusic(){  
		var agent = navigator.userAgent.toLowerCase() ;//判断手机系统  
		if(agent.indexOf("mac os x") > 0){  
			//ios   
			$(".J_Music").removeAttr("autoplay");  
		}  
	}
	function showPoster(){
		var x=5,y=1;
		var posterWord = ["远离社交恐惧和加班黑洞的海滩","距离目的地6978公里的家","和目的地相隔2小时时差的候机大厅","离地27590英尺的空中图书馆","离地27590英尺的空中图书馆"];
		var randNum = parseInt(Math.random() * (x - y + 1) + y);
		$(".J_PosterBg").css("background-image","url(./../image/poster_"+randNum+".png)");
		$(".J_PosterWord").text(posterWord[randNum-1]);

		//生成海报png
		iosMusic();
		html2canvas(document.querySelector(".J_PosterContent")).then(canvas => {
			var canvasSrc = canvas.toDataURL("png");
			$('.J_PosterCanvas').attr('src',canvasSrc);
			$(".J_PosterContent").hide();
			$(".J_PagePoster").css("height","100%");
			$(".J_PagePoster").css("z-index","100");
			$(".J_PageNote").hide();
		});
	}

	
});