let root;
let grapltab;

// panel.js
chrome.devtools.network.onRequestFinished.addListener(request => {
    // 只有当request请求为Fetch/XHR时才处理
    if (request.request.method !== 'POST' || request.request.url.indexOf('graphql') === -1) {
        return;
    }
    const requestDiv = document.createElement('div');
    // 去除 request.request.url中 参数部分
    var url = request.request.url.split('?')[0];
    // 如果当前url 中存在hub- ,说明是原始服务是由hub提供。 则在url后换行增加原始服务地址
    if (url.indexOf('hub-') !== -1) {
        // 将 url 最后一个/ 后面内容取出,
        // 例如https://cloud.ketanyun.cn/bus/graphql/hub-trace 取出 hub-trace,然后根据-分割后，转变成/hub/trace/graphql
        var hub = url.split('/').pop();
        if (hub.indexOf('-') !== -1) {
            hub = hub.split('-').join('/');
        }
        url += '\n' + 'http://localhost:8080/' + hub+'/graphql';
    }
    requestDiv.textContent =url;
    //requestDiv.textContent 增加css美化 靠左
    requestDiv.style.backgroundColor = '#f5f5f5';
    requestDiv.style.color='blue';
    requestDiv.style.fontSize = '12px';
    requestDiv.style.padding = '8px';

    const buttonDiv = document.createElement('div');
    const testBtn = document.createElement('button');
    testBtn.textContent = 'TEST';
    testBtn.onclick = () => loadRequestInGraphiQL(request);
    // 按钮增加css美化 小按钮 靠右
    testBtn.className = 'custom-btn green';
    buttonDiv.appendChild(testBtn);
    // requestDiv下方增加区域，默认隐藏
    const responseDiv = document.createElement('div');
    responseDiv.style.display = 'none';
    responseDiv.style.backgroundColor = '#f5f5f5';
    responseDiv.style.padding = '8px';
    responseDiv.style.margin = '8px';
    responseDiv.style.borderRadius = '4px';
    responseDiv.style.fontSize = '12px';
    // 增加按钮,点击后将request 请求生成为curl请求，不换行，然后在responseDiv显示curl内容
    const curlBtn = document.createElement('button');
    curlBtn.textContent = 'CURL';
    curlBtn.className = 'custom-btn blue';
    curlBtn.onclick = () => {
        const curl = generateCurl(request.request);
        responseDiv.textContent = curl;
        responseDiv.style.display = 'block';
    };
    buttonDiv.appendChild(curlBtn);

    document.getElementById('requests').appendChild(requestDiv);
    document.getElementById('requests').appendChild(buttonDiv);
    document.getElementById('requests').appendChild(responseDiv);
});

function generateCurl(request) {
    // 根据request 生成 curl post请求。包含请求体，请求头中只需要Content-Type 和 Authorization
    const { url, method, postData } = request;
    // 初始化headers和body变量
    let headers = '';
    // 获取请求头
    request.headers.forEach((value, key) => {
        // key 是数组下标， value 是jsonObject
        if (value.name.toLowerCase() === 'content-type' || value.name.toLowerCase() === 'authorization') {
            headers += `-H "${value.name}: ${value.value}" `;
        }
    });
    // 构建请求体
    const body = postData ? `-d '${postData.text}'` : '';
    // 构建curl命令
    const curlCommand = `curl -X ${method || 'POST'} "${url}" ${headers} ${body}`;
    return curlCommand;

}



function loadRequestInGraphiQL(request) {
    // 将请求数据填充到GraphiQL
    console.log(request)
    var parse = JSON.parse(request.request.postData.text);
    console.log(parse)
    console.log(parse.query)
    // 遍历 request.request.headers，将每个 header 的 key 和 value 的jsonObject对象
    var headers='';
    request.request.headers.forEach( (header) => {
        if(header.name==='authorization'){
            headers=header.value;
        }
    });
    // 如果headers为空
    if(headers===''){
        headers='Unable to get headers it may be that the bus cross domain is not enabled';
    }

    const fetcher = GraphiQL.createFetcher({
        url: request.request.url,
        headers: {'Authorization': headers},
    });
    root.render(
        React.createElement(GraphiQL, {
            fetcher,
            defaultEditorToolsVisibility: true,
            query: parse.query,
            variables: JSON.stringify(parse.variables),
            operationName: parse.operationName,
            headers: JSON.stringify( {'Authorization': headers}),
        }),
    );
}


// 在 panel.js 中初始化 GraphiQL
document.addEventListener('DOMContentLoaded', function() {
    root = ReactDOM.createRoot(document.getElementById('graphiql'));
    const fetcher = GraphiQL.createFetcher({
        url: 'https://your-api-url.com/graphql',
        headers: {'Authorization': 'Bearer your-token'},
    });
    grapltab = React.createElement(GraphiQL, {
        fetcher,
        defaultEditorToolsVisibility: true,
        query: 'query { hello }',
        variables: "{\n  \"name\": \"World\"\n}",
    });
    root.render(
        grapltab,
    );
    document.getElementById('cleanBtn').onclick = () => {
        console.log('cleanRequests')
        // 清除 div requests 中的 除 cleanBtn 外的所有子元素
        document.getElementById('requests').innerHTML = '';
    };
});