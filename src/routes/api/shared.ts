export const normalized = (url: string) => {
    url = url.replace('localhost', '127.0.0.1');
    return url.endsWith('/') ? url : url + '/';
}