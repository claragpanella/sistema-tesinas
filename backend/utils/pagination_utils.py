from flask import request, jsonify
from math import ceil

def paginate(query_result, default_per_page=10, max_per_page=100):
    """
    Pagina los resultados de una consulta
    """
    # Obtener parámetros de paginación de la query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_per_page, type=int)
    
    # Validaciones
    if page < 1:
        page = 1
    
    if per_page < 1:
        per_page = default_per_page
    
    if per_page > max_per_page:
        per_page = max_per_page
    
    # Calcular índices
    total_items = len(query_result)
    total_pages = ceil(total_items / per_page) if total_items > 0 else 1
    
    # Ajustar página si está fuera de rango
    if page > total_pages and total_pages > 0:
        page = total_pages
    
    start_index = (page - 1) * per_page
    end_index = start_index + per_page
    
    # Obtener items de la página actual
    items = query_result[start_index:end_index]
    
    return {
        'items': items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_items': total_items,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages,
            'prev_page': page - 1 if page > 1 else None,
            'next_page': page + 1 if page < total_pages else None
        }
    }


def get_pagination_params():
    """
    Obtiene y valida los parámetros de paginación de la request
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Validaciones
    if page < 1:
        page = 1
    
    if per_page < 1:
        per_page = 10
    
    if per_page > 100:
        per_page = 100
    
    limit = per_page
    offset = (page - 1) * per_page
    
    return limit, offset


def create_pagination_response(items, total_count, page=None, per_page=None):
    """
    Crea una respuesta paginada desde una query con LIMIT/OFFSET
    """
    if page is None:
        page = request.args.get('page', 1, type=int)
    
    if per_page is None:
        per_page = request.args.get('per_page', 10, type=int)
    
    # Validaciones
    if page < 1:
        page = 1
    
    if per_page < 1:
        per_page = 10
    
    if per_page > 100:
        per_page = 100
    
    total_pages = ceil(total_count / per_page) if total_count > 0 else 1
    
    return {
        'items': items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_items': total_count,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages,
            'prev_page': page - 1 if page > 1 else None,
            'next_page': page + 1 if page < total_pages else None
        }
    }