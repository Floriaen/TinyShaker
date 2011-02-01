<?php

	/*
		- random improvments
		- cache request
		

	*/
	
	ini_set('error_reporting', E_ALL);
	if (isset($_REQUEST['url'])) {
		$tinyUrl = TinyUrlFactory::getTinyUrl($_REQUEST['url']);
		echo $tinyUrl->getHttpCode();
	}
	
	
	class TinyUrlFactory {

		public static function getTinyUrl($url) {
			if ($url) 
			{
				$urlInfo = parse_url($url);
				$host = str_replace('www.', '', $urlInfo['host']);
				$tokens = explode('.', $host);
				if (count($tokens) == 2) {
					// construct the class name from url:
					// 	www.tinyurl.com --> TinyurlDotCom for example
					$className = ucfirst($tokens[0]).'Dot'.ucfirst($tokens[1]);
					if (class_exists($className)) {
						return new $className($url);
					} else {
						throw new Exception('No associated class found for url '.$host);
					}
				} else {
					throw new Exception('something must be developed');
				}
			}
			return null;
		}
		
	}	

	abstract class AbstractTinyUrl {

		protected $_content = null;
		protected $_header = null;
		protected $_url = null;

		public function __construct($url) {
			$this->_url = $url;
			$handle = curl_init($_REQUEST['url']);
			$options = array( 
			    CURLOPT_RETURNTRANSFER => true,     // return web page 
			    CURLOPT_HEADER         => true,    // return headers 
			    CURLOPT_FOLLOWLOCATION => true,     // follow redirects 
			    CURLOPT_ENCODING       => "",       // handle all encodings 
			    CURLOPT_USERAGENT      => "Ninja Shaker", // who am i 
			    CURLOPT_AUTOREFERER    => true,     // set referer on redirect 
			    CURLOPT_CONNECTTIMEOUT => 120,      // timeout on connect 
			    CURLOPT_TIMEOUT        => 120,      // timeout on response 
			    CURLOPT_MAXREDIRS      => 10,       // stop after 10 redirects 
			);

			curl_setopt_array($handle,  $options);
			//curl_setopt($handle,  CURLOPT_RETURNTRANSFER, TRUE);

			$this->_content = curl_exec($handle);
			$this->_header  = curl_getinfo($handle);
			curl_close($handle);
		}
		
		abstract function getHttpCode();
		
		protected function _getHttpCodeFromHeader() {
			$code = '404';
			
			if ($this->_header['http_code'] != '200') {
				$this->_content = null; // reset the response
				$code = $this->_header['http_code'];
			} else {
				if ($this->_content) {
					$code = '200';
				}
			}
			return $code;
		}
		
		protected function _isContentContains($text) {
			return (strpos($this->_content, $text) !== FALSE);
		}
		
	}
	
	class TDotCo extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
			//	echo $this->_header['content_type'];
			//	var_dump( strpos('text/html', $this->_header['content_type']) );
				if (strpos($this->_header['content_type'], 'text/html') !== FALSE) {
					if (!$this->_isContentContains('What are you lookin\' at?')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}
	
	class ImgurDotCom extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
			//	echo $this->_header['content_type'];
			//	var_dump( strpos('text/html', $this->_header['content_type']) );
				if (strpos($this->_header['content_type'], 'text/html') !== FALSE) {
					if (!$this->_isContentContains('What are you lookin\' at?')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}

	class TinyurlDotCom extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
				if ('text/html' == $this->_header['content_type']) {
					$found = strpos($this->_header['url'], 'http://tinyurl.com/redirect.php');
					if ($found === FALSE) {
						if (!$this->_isContentContains('you visited was used by its creator in violation of our terms of use')) {
							$code = '200';
						}
					}
				}
			}
			return $code;
		}
	}
	
	class TwitgooDotCom extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
			//	echo $this->_header['content_type'];
			//	var_dump( strpos('text/html', $this->_header['content_type']) );
				if (strpos($this->_header['content_type'], 'text/html') !== FALSE) {
					if (!$this->_isContentContains('What are you lookin\' at?')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}
	
	class TwitpicDotCom extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
				if ('text/html' == $this->_header['content_type']) {
					if (!$this->_isContentContains('The photo you were looking for no longer exists')) {
						if (!$this->_isContentContains('There was an error loading this page, please try again.')) {
							$code = '200';
						}
					}
				}
			}
			return $code;
		}
	}
	
	class BitDotLy extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
				if ('text/html' == $this->_header['content_type']) {
					if (!$this->_isContentContains('there might be a problem with the requested link')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}
	
	class TinyDotCc extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
				if ('text/html' == $this->_header['content_type']) {
					if (!$this->_isContentContains('Sorry, we weren\'t able to locate that URL.')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}
	
	class GooDotGl extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
				if ('text/html' == $this->_header['content_type']) {
					if (!$this->_isContentContains('there might be a problem with the requested link')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}
	
	class YfrogDotCom extends AbstractTinyUrl {
		
		public function getHttpCode() {
			$code = $this->_getHttpCodeFromHeader();
			if ('200' == $code) {
				$code =  '404';
				if ('text/html' == $this->_header['content_type']) {
					if (!$this->_isContentContains('there might be a problem with the requested link')) {
						$code = '200';
					}
				}
			}
			return $code;
		}
	}
	
				/*		
					case 'tinypic.com':
						if ($realUrl != 'http://tinypic.com/images/404.gif') {
							$code = '1';
						} else {
							$code = '404';
						}
						
					case 'nsfw.com':
						
						$found = strpos($response, 'We are sorry, it appears that the link is invalid.');
						if ($found === FALSE ) {
							$code =  '1'; // success
						} else {
							$code =  '404';
						}

						break;
				*/		

?>