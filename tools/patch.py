# -*- coding: utf-8 -*-
"""index.html 을 안전하게 고친다.

   전에 쓰기 도중 인코딩 예외가 나면서 index.html 이 0바이트로 날아간 적이 있다.
   그래서 ① 새 내용을 메모리에서 다 만들고 ② utf-8 로 인코딩되는지 먼저 확인하고
   ③ 임시 파일에 쓴 뒤 ④ os.replace 로 바꿔치기한다. 실패하면 원본이 그대로 남는다.
"""
import io, os, sys

PATH = os.path.join(os.path.dirname(__file__), '..', 'index.html')


def read():
    return io.open(PATH, encoding='utf-8', newline='').read()


def nl_of(s):
    return '\r\n' if '\r\n' in s else '\n'


def write(s):
    s.encode('utf-8')                      # 인코딩 못 하면 여기서 멈춘다 — 원본은 무사하다
    tmp = PATH + '.tmp'
    with io.open(tmp, 'w', encoding='utf-8', newline='') as f:
        f.write(s)
    os.replace(tmp, PATH)


def sub(s, old, new, count=1, what=''):
    n = s.count(old)
    if n != count:
        raise SystemExit('패치 지점 %s: %d 곳 찾음 (기대 %d)' % (what or repr(old[:40]), n, count))
    return s.replace(old, new, count)
