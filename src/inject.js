// fetch terms from event page
var terms = []
chrome.runtime.sendMessage({msg: 'terms'}, function(response) {
  terms = response.terms;
});

// https://stackoverflow.com/a/29301739
function matchText(node, regex, callback, excludeElements) {
  excludeElements || (excludeElements = ['script', 'style', 'iframe', 'canvas']);
  var child = node.firstChild;

  while (child) {
    switch (child.nodeType) {
    case 1:
      if (excludeElements.indexOf(child.tagName.toLowerCase()) > -1)
        break;
      matchText(child, regex, callback, excludeElements);
      break;
    case 3:
      var bk = 0;
      child.data.replace(regex, function(all) {
        var args = [].slice.call(arguments),
            offset = args[args.length - 2],
            newTextNode = child.splitText(offset+bk), tag;
        bk -= child.data.length + all.length;

        newTextNode.data = newTextNode.data.substr(all.length);
        tag = callback.apply(window, [child].concat(args));
        child.parentNode.insertBefore(tag, newTextNode);
        child = newTextNode;
      });
      regex.lastIndex = 0;
      break;
    }

    child = child.nextSibling;
  }

  return node;
};

chrome.extension.sendMessage({}, function(response) {
  var readyStateCheckInterval = setInterval(function() {
    if (document.readyState === 'complete') {
      clearInterval(readyStateCheckInterval);

      // highlight terms
      terms.map(obj => {
        var term = obj.term;
        matchText(document.body, new RegExp('\\b' + term + '\\b', 'gi'), function(node, match, offset) {
          var span = document.createElement('span');
          span.className = 'h8db-term';
          span.textContent = match;
          span.style.backgroundColor = 'rgba(255,0,0,0.3)';
          span.dataset.h8db_term = term;
          span.dataset.h8db_definition = obj.explanation;
          return span;
        });
      })

      // setup hover popover
      var offset = 5;
      var popover = document.createElement('div');
      popover.style.position = 'fixed';
      popover.style.zIndex = 10000;
      popover.style.display = 'none';
      popover.style.fontFamily = 'Helvetica, sans-serif';
      popover.style.backgroundColor = '#fff';
      popover.style.boxShadow = '2px 2px 2px rgba(0,0,0,0.2)';
      popover.style.padding = '1em';
      popover.style.maxWidth = '360px';
      popover.style.fontSize = '15px';
      popover.style.lineHeight = '1.3';
      document.body.appendChild(popover);
      document.addEventListener('mousemove', function(ev) {
        popover.style.top = (ev.clientY + offset) + 'px';
        popover.style.left = (ev.clientX + offset) + 'px';
      });

      // bind popover events for highlighted terms
      var termEls = document.querySelectorAll('.h8db-term');
      for (var i=0; i<termEls.length; i++) {
        termEls[i].addEventListener('mouseenter', function(ev) {
          clearTimeout(popover.timer);
          popover.style.display = 'block';
          popover.innerHTML = ev.target.dataset.h8db_definition;
        });
        termEls[i].addEventListener('mouseleave', function(ev) {
          popover.timer = setTimeout(function() {
            popover.style.display = 'none';
          }, 10);
        });
      }
    }
  }, 10);
});