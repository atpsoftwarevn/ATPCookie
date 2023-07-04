var listCookies = [];
var currentCookie = "";
var currentUid = "";
var chromeTab;
var acceptTerm = false;

initExtension();
function initExtension() {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chromeTab = tabs[0];
	});
}

function loadCookie() {
	if (!acceptTerm) {
		window.close();
		return;
	}
	var currentUrl = chromeTab.url;
	if (currentUrl.indexOf('chrome://newtab') > -1) {
		currentUrl = "https://www.facebook.com";
	}
	$('#url-cookie-current').html('Platform: ' + extractHostname(currentUrl));
	if (currentUrl.includes('chat.zalo.me')) {
		chrome.cookies.getAll({}, function (cookie) {
			var listCookieZalo = cookie.filter((c) => c.domain.includes('zalo'));
			var tabId = chromeTab.id;
			chrome.scripting.executeScript({
				target: { tabId: tabId },
				function: () => {
					return localStorage["z_uuid"];
				},
			}, function (results) {
				var imei = results[0].result;
				if (imei) {
					var result = "imei=" + imei + ";";
					var jsonCookie = JSON.stringify(listCookieZalo);
					currentCookie = jsonCookie + '|' + result + '|' + navigator.userAgent;
					document.getElementById('cookie-result').value = currentCookie;
				}
			});
		});
	} else {
		chrome.cookies.getAll({ "url": currentUrl }, function (cookie) {
			var result = "";
			cookie.forEach((c) => {
				result += c.name + "=" + c.value + ";";
				if (c.name === "c_user") {
					currentUid = c.value;
				}
			});
			currentCookie = result + '|' + navigator.userAgent;
			document.getElementById('cookie-result').value = currentCookie;
		});
	}
}


document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('cookie-result').onclick = function () {
		document.getElementById('cookie-result').select();
	};

	document.getElementById('btn-import-cookie').onclick = function () {
		var cookie = document.getElementById('cookie-result').value;
		if (!cookie) {
			chrome.scripting.executeScript({
				target: { tabId: chromeTab.id },
				function: () => {
					alert("Please enter cookie to import!");
				}
			});
			return;
		}
		importCookie(cookie);
	};

	if (localStorage.getItem("listCookies") !== null) {
		listCookies = JSON.parse(localStorage.listCookies);
	}

	for (var i = 0; i < listCookies.length; i++) {
		addNewCookie(listCookies[i]);
	}

	$('#accept-term').click(function() {
		let checkTerm = document.getElementById('term-check').checked;
		if (!checkTerm) {
			alert('Vui lòng đồng ý "Chính sách bảo mật" của ATP Cookie.');
			return;
		}
		$('#getCookiePanel').show();
		$('#termPanel').hide();
		acceptTerm = true;
		loadCookie();
	});

	$('#disagree-term').click(function() {
		acceptTerm = false;
		window.close();
	});

	$('#btn-save-cookie').click(function () {
		var nameCookie = prompt("Đặt tên cho cookie muốn lưu tại:");
		if (!nameCookie) {
			alert('Vui lòng đặt tên cho cookie muốn lưu lại.');
			return;
		}
		var cookie = document.getElementById('cookie-result').value;
		var cc = {
			name: nameCookie,
			cookie: cookie,
		};
		var isExist = listCookies.find(cookie => cookie.name === name);
		if (!isExist) {
			listCookies.push(cc);
			addNewCookie(cc)
		}
		localStorage.listCookies = JSON.stringify(listCookies);
	});

	$("#btn-cookie-logout").click(function () {
		clearAllCookies(function () {
			chrome.tabs.reload(chromeTab.id);
		});
	});

	$('#policy-page').click(function () {
		chrome.tabs.create({ url: 'https://atpsoftware.vn/chinh-sach-bao-mat-atp-cookie' }, function(tab) {
		});
	});

	$('#btn-download-cookie').click(function () {
		var filename = 'CookiesAll.txt'; // You can use the .txt extension if you want
		var cookies = "";
		for (var j = 0; j < listCookies.length; j++) {
			cookies = cookies + listCookies[j].cookie + "\r\n" + "____________________________________________________________\n\n";
		}
		var link = document.createElement('a');
		var mimeType = 'text/plain';
		link.setAttribute('download', filename);
		link.setAttribute('target', '_blank');
		link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(cookies));
		link.click();
	});
});
function extractHostname(url) {
	var hostname;
	// Tìm và xóa protocol (http, ftp, etc.) và lấy hostname
	if (url.indexOf("://") > -1) {
		hostname = url.split('/')[2];
	} else {
		hostname = url.split('/')[0];
	}
	// Tìm và xóa port
	hostname = hostname.split(':')[0];
	// Tìm và xóa ?
	hostname = hostname.split('?')[0];
	return hostname;
}

function importCookie(cookie) {
	var arr = cookie.split("|");
	if (arr.length > 2) {
		for (var i = 0; i < arr.length; i++) {
			try {
				if (arr[i].indexOf('c_user') > -1) {
					cookie = arr[i];
				}
			} catch (ex) {
				console.log(ex);
			}
		}
	}
	clearAllCookies(function () {
		var all = cookie.split(';');
		for (var i = 0; i < all.length; i++) {
			try {
				var name = all[i].split('=')[0].trim();
				var val = all[i].split('=')[1].trim();
				chrome.cookies.set({ url: "https://www.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://upload.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://business.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://web.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://m.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://mbasic.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://developers.facebook.com", name: name, value: val });
				chrome.cookies.set({ url: "https://mobile.facebook.com", name: name, value: val });
			} catch (ex) {
				console.log(ex);
			}
		}
		chrome.tabs.reload(chromeTab.id);
	});
}

function addNewCookie(cc) {
	var div = $("<div id='cc_" + cc.name + "' class='cc' name='" + cc.name + "'>" + cc.name + "<span class='delete' name='" + cc.name + "'>X</span></div>");
	$("#list_cookie").append(div);
	$('#cc_' + cc.name).click(function () {
		for (var j = 0; j < listCookies.length; j++) {
			if (listCookies[j].name === cc.name) {
				importCookie(listCookies[j].cookie)
				document.getElementById('cookie-result').value = listCookies[j].cookie;
				if (chromeTab.url.indexOf('chrome://') > -1) {
					chrome.tabs.update(tab.id, {
						url: "https://www.facebook.com"
					});
				}
			}
		}
	});
	$('#cc_' + cc.name + " .delete").click(function () {
		var name = $(this).attr("name");
		for (var j = 0; j < listCookies.length; j++) {
			if (listCookies[j].name === name) {
				listCookies.splice(j, 1);
				$(this).parent().remove();
				localStorage.listCookies = JSON.stringify(listCookies);
			}
		}
		return false;
	});
}

var clearAllCookies = function (callback) {
	if (!chrome.cookies) {
		chrome.cookies = chrome.experimental.cookies;
	}
	var removeCookie = function (cookie) {
		var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path;
		chrome.cookies.remove({ "url": url, "name": cookie.name });
	};
	chrome.cookies.getAll({ domain: "facebook.com" }, function (all_cookies) {
		var count = all_cookies.length;
		for (var i = 0; i < count; i++) {
			removeCookie(all_cookies[i]);
		}
		callback();
	});
	return "COOKIES_CLEARED_VIA_EXTENSION_API";
};
