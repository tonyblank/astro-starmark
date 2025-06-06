// ES module replacement for cssesc
const cssesc = function(string, options) {
  const opts = options || {};
  
  if (opts.quotes != 'single' && opts.quotes != 'double') {
    opts.quotes = 'single';
  }
  
  const quote = opts.quotes == 'double' ? '"' : "'";
  const isIdentifier = opts.isIdentifier;
  
  if (!string) return opts.wrap ? quote + quote : '';
  
  let output = '';
  let counter = 0;
  const length = string.length;
  
  while (counter < length) {
    const character = string.charAt(counter++);
    const codePoint = character.charCodeAt();
    let value;
    
    // Handle non-printable ASCII characters
    if (codePoint < 0x20 || codePoint > 0x7E) {
      if (codePoint >= 0xD800 && codePoint <= 0xDBFF && counter < length) {
        const extra = string.charCodeAt(counter++);
        if ((extra & 0xFC00) == 0xDC00) {
          const combinedCodePoint = ((codePoint & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
          value = `\\${combinedCodePoint.toString(16).toUpperCase()} `;
        } else {
          counter--;
          value = `\\${codePoint.toString(16).toUpperCase()} `;
        }
      } else {
        value = `\\${codePoint.toString(16).toUpperCase()} `;
      }
    } else {
      if (opts.escapeEverything) {
        if (/[ -,./:\-@[\]^`{-~]/.test(character)) {
          value = `\\${character}`;
        } else {
          value = `\\${codePoint.toString(16).toUpperCase()} `;
        }
      } else if (/[\t\n\f\r\v]/.test(character)) {
        value = `\\${codePoint.toString(16).toUpperCase()} `;
      } else if (character == '\\' || 
                (!isIdentifier && (character == '"' && quote == character || character == "'" && quote == character)) ||
                (isIdentifier && /[ -,./:\-@[\]^`{-~]/.test(character))) {
        value = `\\${character}`;
      } else {
        value = character;
      }
    }
    output += value;
  }
  
  if (isIdentifier) {
    if (/^-[-\d]/.test(output)) {
      output = `\\-${output.slice(1)}`;
    } else if (/\d/.test(string.charAt(0))) {
      output = `\\3${string.charAt(0)} ${output.slice(1)}`;
    }
  }
  
  // Remove excessive spaces after hex escapes
  output = output.replace(/(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g, function($0, $1, $2) {
    if ($1 && $1.length % 2) {
      return $0;
    }
    return ($1 || '') + $2;
  });
  
  if (!isIdentifier && opts.wrap) {
    return quote + output + quote;
  }
  
  return output;
};

cssesc.options = {
  'escapeEverything': false,
  'isIdentifier': false,
  'quotes': 'single',
  'wrap': false
};

cssesc.version = '3.0.0';

export default cssesc;