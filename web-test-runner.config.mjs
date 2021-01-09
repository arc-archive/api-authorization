export default {
	files: 'test/**/*.test.js',
	nodeResolve: true,
	middleware: [
	  function rewriteBase(context, next) {
		if (context.url.indexOf('/base') === 0) {
		  context.url = context.url.replace('/base', '');
		}
		return next();
	  }
	],
	testRunnerHtml: (testFramework) =>
	  `<html>
		  <body>
			<script src="node_modules/cryptojslib/components/core.js"></script>
			<script src="node_modules/cryptojslib/rollups/sha1.js"></script>
			<script src="node_modules/cryptojslib/components/enc-base64-min.js"></script>
			<script src="node_modules/cryptojslib/rollups/md5.js"></script>
			<script src="node_modules/cryptojslib/rollups/hmac-sha1.js"></script>
			<script type="module" src="${testFramework}"></script>
		  </body>
		</html>`
  };
