/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS 180-1
 * Version 2.2 Copyright Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_sha1(s)    { return rstr2hex(rstr_sha1(str2rstr_utf8(s))); }
function b64_sha1(s)    { return rstr2b64(rstr_sha1(str2rstr_utf8(s))); }
function any_sha1(s, e) { return rstr2any(rstr_sha1(str2rstr_utf8(s)), e); }
function hex_hmac_sha1(k, d)
  { return rstr2hex(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d))); }
function b64_hmac_sha1(k, d)
  { return rstr2b64(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d))); }
function any_hmac_sha1(k, d, e)
  { return rstr2any(rstr_hmac_sha1(str2rstr_utf8(k), str2rstr_utf8(d)), e); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function sha1_vm_test()
{
  return hex_sha1("abc").toLowerCase() == "a9993e364706816aba3e25717850c26c9cd0d89d";
}

/*
 * Calculate the SHA1 of a raw string
 */
function rstr_sha1(s)
{
  return binb2rstr(binb_sha1(rstr2binb(s), s.length * 8));
}

/*
 * Calculate the HMAC-SHA1 of a key and some data (raw strings)
 */
function rstr_hmac_sha1(key, data)
{
  var bkey = rstr2binb(key);
  if(bkey.length > 16) bkey = binb_sha1(bkey, key.length * 8);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = binb_sha1(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
  return binb2rstr(binb_sha1(opad.concat(hash), 512 + 160));
}

/*
 * Convert a raw string to a hex string
 */
function rstr2hex(input)
{
  try { hexcase } catch(e) { hexcase=0; }
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var output = "";
  var x;
  for(var i = 0; i < input.length; i++)
  {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F)
           +  hex_tab.charAt( x        & 0x0F);
  }
  return output;
}

/*
 * Convert a raw string to a base-64 string
 */
function rstr2b64(input)
{
  try { b64pad } catch(e) { b64pad=''; }
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (input.charCodeAt(i) << 16)
                | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
                | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > input.length * 8) output += b64pad;
      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
}

/*
 * Convert a raw string to an arbitrary string encoding
 */
function rstr2any(input, encoding)
{
  var divisor = encoding.length;
  var remainders = Array();
  var i, q, x, quotient;

  /* Convert to an array of 16-bit big-endian values, forming the dividend */
  var dividend = Array(Math.ceil(input.length / 2));
  for(i = 0; i < dividend.length; i++)
  {
    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
  }

  /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. We stop when the dividend is zero.
   * All remainders are stored for later use.
   */
  while(dividend.length > 0)
  {
    quotient = Array();
    x = 0;
    for(i = 0; i < dividend.length; i++)
    {
      x = (x << 16) + dividend[i];
      q = Math.floor(x / divisor);
      x -= q * divisor;
      if(quotient.length > 0 || q > 0)
        quotient[quotient.length] = q;
    }
    remainders[remainders.length] = x;
    dividend = quotient;
  }

  /* Convert the remainders to the output string */
  var output = "";
  for(i = remainders.length - 1; i >= 0; i--)
    output += encoding.charAt(remainders[i]);

  /* Append leading zero equivalents */
  var full_length = Math.ceil(input.length * 8 /
                                    (Math.log(encoding.length) / Math.log(2)))
  for(i = output.length; i < full_length; i++)
    output = encoding[0] + output;

  return output;
}

/*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
function str2rstr_utf8(input)
{
  var output = "";
  var i = -1;
  var x, y;

  while(++i < input.length)
  {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
    {
      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
      i++;
    }

    /* Encode output as utf-8 */
    if(x <= 0x7F)
      output += String.fromCharCode(x);
    else if(x <= 0x7FF)
      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0xFFFF)
      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0x1FFFFF)
      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                    0x80 | ((x >>> 12) & 0x3F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
  }
  return output;
}

/*
 * Encode a string as utf-16
 */
function str2rstr_utf16le(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
                                  (input.charCodeAt(i) >>> 8) & 0xFF);
  return output;
}

function str2rstr_utf16be(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
                                   input.charCodeAt(i)        & 0xFF);
  return output;
}

/*
 * Convert a raw string to an array of big-endian words
 * Characters >255 have their high-byte silently ignored.
 */
function rstr2binb(input)
{
  var output = Array(input.length >> 2);
  for(var i = 0; i < output.length; i++)
    output[i] = 0;
  for(var i = 0; i < input.length * 8; i += 8)
    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
  return output;
}

/*
 * Convert an array of big-endian words to a string
 */
function binb2rstr(input)
{
  var output = "";
  for(var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i>>5] >>> (24 - i % 32)) & 0xFF);
  return output;
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function binb_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = bit_rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(bit_rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = bit_rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/* 
 * JavaScript implementation of Password-Based Key Derivation Function 2
 * (PBKDF2) as defined in RFC 2898.
 * Version 1.5 
 * Copyright (c) 2007, 2008, 2009, 2010, 2011, 2012, 2013 Parvez Anandam
 * parvez@anandam.com
 * http://anandam.com/pbkdf2
 *
 * Distributed under the BSD license
 *
 * Uses Paul Johnston's excellent SHA-1 JavaScript library sha1.js:
 * http://pajhome.org.uk/crypt/md5/sha1.html
 * (uses the binb_sha1(), rstr2binb(), binb2str(), rstr2hex() functions from that libary)
 *
 * Thanks to Felix Gartsman for pointing out a bug in version 1.0
 * Thanks to Thijs Van der Schaeghe for pointing out a bug in version 1.1 
 * Thanks to Richard Gautier for asking to clarify dependencies in version 1.2
 * Updated contact information from version 1.3
 * Thanks to Stuart Heinrich for pointing out updates to PAJ's SHA-1 library in version 1.4
 */

// Modified to not use callbacks by Allan Wirth 1/17/2015


/*
 * The four arguments to the constructor of the PBKDF2 object are 
 * the password, salt, number of iterations and number of bytes in
 * generated key. This follows the RFC 2898 definition: PBKDF2 (P, S, c, dkLen)
 *
 * The method deriveKey takes two parameters, both callback functions:
 * the first is used to provide status on the computation, the second
 * is called with the result of the computation (the generated key in hex).
 *
 * Example of use:
 *
 *    <script src="sha1.js"></script>
 *    <script src="pbkdf2.js"></script>
 *    <script>
 *    var mypbkdf2 = new PBKDF2("mypassword", "saltines", 1000, 16);
 *    var status_callback = function(percent_done) {
 *        document.getElementById("status").innerHTML = "Computed " + percent_done + "%"};
 *    var result_callback = function(key) {
 *        document.getElementById("status").innerHTML = "The derived key is: " + key};
 *    mypbkdf2.deriveKey(status_callback, result_callback);
 *    </script>
 *    <div id="status"></div>
 *
 */
function PBKDF2(password, salt, num_iterations, num_bytes)
{
	// Remember the password and salt
	var m_bpassword = rstr2binb(password);
	var m_salt = salt;

	// Total number of iterations
	var m_total_iterations = num_iterations;

	// Run iterations in chunks instead of all at once, so as to not block.
	// Define size of chunk here; adjust for slower or faster machines if necessary.
	var m_iterations_in_chunk = 10;

	// Iteration counter
	var m_iterations_done = 0;

	// Key length, as number of bytes
	var m_key_length = num_bytes;

	// The hash cache
	var m_hash = null;

	// The length (number of bytes) of the output of the pseudo-random function.
	// Since HMAC-SHA1 is the standard, and what is used here, it's 20 bytes.
	var m_hash_length = 20;

	// Number of hash-sized blocks in the derived key (called 'l' in RFC2898)
	var m_total_blocks = Math.ceil(m_key_length/m_hash_length);

	// Start computation with the first block
	var m_current_block = 1;

	// Used in the HMAC-SHA1 computations
	var m_ipad = new Array(16);
	var m_opad = new Array(16);

	// This is where the result of the iterations gets sotred
	var m_buffer = new Array(0x0,0x0,0x0,0x0,0x0);
	
	// The result
	var m_key = "";

	// This object
	var m_this_object = this;

	// Set up the HMAC-SHA1 computations
	if (m_bpassword.length > 16) m_bpassword = binb_sha1(m_bpassword, password.length * chrsz);
	for(var i = 0; i < 16; ++i)
	{
		m_ipad[i] = m_bpassword[i] ^ 0x36363636;
		m_opad[i] = m_bpassword[i] ^ 0x5C5C5C5C;
	}


	// Starts the computation
	this.deriveKey = function()
	{
		return m_this_object.do_PBKDF2_iterations()
	}


	// The workhorse
	this.do_PBKDF2_iterations = function()
	{
	    while(true) {
		var iterations = m_iterations_in_chunk;
		if (m_total_iterations - m_iterations_done < m_iterations_in_chunk)
			iterations = m_total_iterations - m_iterations_done;
			
		for(var i=0; i<iterations; ++i)
		{
			// compute HMAC-SHA1 
			if (m_iterations_done == 0)
			{
				var salt_block = m_salt +
						String.fromCharCode(m_current_block >> 24 & 0xF) +
						String.fromCharCode(m_current_block >> 16 & 0xF) +
						String.fromCharCode(m_current_block >>  8 & 0xF) +
						String.fromCharCode(m_current_block       & 0xF);

				m_hash = binb_sha1(m_ipad.concat(rstr2binb(salt_block)),
								   512 + salt_block.length * 8);
				m_hash = binb_sha1(m_opad.concat(m_hash), 512 + 160);
			}
			else
			{
				m_hash = binb_sha1(m_ipad.concat(m_hash), 
								   512 + m_hash.length * 32);
				m_hash = binb_sha1(m_opad.concat(m_hash), 512 + 160);
			}

        	for(var j=0; j<m_hash.length; ++j)
                	m_buffer[j] ^= m_hash[j];

			m_iterations_done++;
		}

		if (m_iterations_done < m_total_iterations)
		{
			continue;
		}
		else
		{
			if (m_current_block < m_total_blocks)
			{
				// Compute the next block (T_i in RFC 2898)
				
				m_key += rstr2hex(binb2rstr(m_buffer));
			
				m_current_block++;
				m_buffer = new Array(0x0,0x0,0x0,0x0,0x0);
				m_iterations_done = 0;

				continue;
			}
			else
			{
				// We've computed the final block T_l; we're done.
			
				var tmp = rstr2hex(binb2rstr(m_buffer));
				m_key += tmp.substr(0, (m_key_length - (m_total_blocks - 1) * m_hash_length) * 2 );
				
				return m_key;
			}
		}
	    }
	}
}

return (new PBKDF2(input.password, input.salt, input.num_iterations, 256)).deriveKey();
