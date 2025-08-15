-- =====================================================
-- ESQUEMA DE BANCO DE DADOS - APLICATIVO VAIMOGI
-- =====================================================
-- Sistema de transporte escolar com rastreamento em tempo real
-- Criado para Supabase PostgreSQL

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- TABELA: drivers (Motoristas)
-- =====================================================
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: vans (Veículos)
-- =====================================================
CREATE TABLE vans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    model VARCHAR(255) NOT NULL,
    plate VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    observations TEXT,
    photo_url TEXT,
    driving_authorization_url TEXT, -- URL do documento de autorização
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: guardians (Responsáveis)
-- =====================================================
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    unique_code VARCHAR(10) UNIQUE, -- Código único para login
    code_generated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: schools (Escolas)
-- =====================================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- Coordenadas geográficas
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: students (Estudantes)
-- =====================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    pickup_point TEXT NOT NULL,
    pickup_location GEOGRAPHY(POINT, 4326), -- Coordenadas do ponto de embarque
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'embarked', 'at_school')),
    dropoff_location VARCHAR(20) DEFAULT 'home' CHECK (dropoff_location IN ('home', 'school')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: routes (Rotas)
-- =====================================================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    week_days INTEGER[] NOT NULL, -- Array de dias da semana (0=domingo, 6=sábado)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: route_students (Estudantes por Rota)
-- =====================================================
CREATE TABLE route_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('embarque', 'desembarque')),
    sequence_order INTEGER, -- Ordem na rota
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, student_id, direction)
);

-- =====================================================
-- TABELA: trips (Viagens)
-- =====================================================
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('to_school', 'to_home')),
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: trip_students (Estudantes por Viagem)
-- =====================================================
CREATE TABLE trip_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'van_arrived', 'embarked', 'at_school', 'disembarked')),
    pickup_time TIMESTAMP WITH TIME ZONE,
    dropoff_time TIMESTAMP WITH TIME ZONE,
    pickup_location GEOGRAPHY(POINT, 4326),
    dropoff_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, student_id)
);

-- =====================================================
-- TABELA: route_tracking (Rastreamento de Rotas)
-- =====================================================
CREATE TABLE route_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy FLOAT,
    speed FLOAT, -- Velocidade em m/s
    heading FLOAT, -- Direção em graus (0-360)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: notifications (Notificações)
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('route_started', 'van_arrived', 'embarked', 'at_school', 'disembarked', 'route_finished')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: route_history (Histórico de Rotas)
-- =====================================================
CREATE TABLE route_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    driver_name VARCHAR(255) NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    students_count INTEGER DEFAULT 0,
    completed_students INTEGER DEFAULT 0,
    total_distance_km FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX idx_drivers_email ON drivers(email);
CREATE INDEX idx_drivers_active ON drivers(is_active);

CREATE INDEX idx_vans_driver_id ON vans(driver_id);
CREATE INDEX idx_vans_plate ON vans(plate);

CREATE INDEX idx_guardians_email ON guardians(email);
CREATE INDEX idx_guardians_unique_code ON guardians(unique_code);
CREATE INDEX idx_guardians_active ON guardians(is_active);

CREATE INDEX idx_students_guardian_id ON students(guardian_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_active ON students(is_active);

CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_routes_active ON routes(is_active);

CREATE INDEX idx_route_students_route_id ON route_students(route_id);
CREATE INDEX idx_route_students_student_id ON route_students(student_id);

CREATE INDEX idx_trips_route_id ON trips(route_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_date ON trips(date);
CREATE INDEX idx_trips_status ON trips(status);

CREATE INDEX idx_trip_students_trip_id ON trip_students(trip_id);
CREATE INDEX idx_trip_students_student_id ON trip_students(student_id);

CREATE INDEX idx_route_tracking_trip_id ON route_tracking(trip_id);
CREATE INDEX idx_route_tracking_timestamp ON route_tracking(timestamp);

CREATE INDEX idx_notifications_guardian_id ON notifications(guardian_id);
CREATE INDEX idx_notifications_student_id ON notifications(student_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_route_history_driver_id ON route_history(driver_id);
CREATE INDEX idx_route_history_created_at ON route_history(created_at);

-- Índices espaciais para consultas geográficas
CREATE INDEX idx_schools_location ON schools USING GIST(location);
CREATE INDEX idx_students_pickup_location ON students USING GIST(pickup_location);
CREATE INDEX idx_route_tracking_location ON route_tracking USING GIST(location);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vans_updated_at BEFORE UPDATE ON vans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_students_updated_at BEFORE UPDATE ON trip_students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON TABLE drivers IS 'Motoristas do sistema de transporte escolar';
COMMENT ON TABLE vans IS 'Veículos utilizados para transporte escolar';
COMMENT ON TABLE guardians IS 'Responsáveis pelos estudantes';
COMMENT ON TABLE schools IS 'Escolas atendidas pelo sistema';
COMMENT ON TABLE students IS 'Estudantes que utilizam o transporte';
COMMENT ON TABLE routes IS 'Rotas de transporte definidas';
COMMENT ON TABLE route_students IS 'Associação entre rotas e estudantes';
COMMENT ON TABLE trips IS 'Viagens realizadas baseadas nas rotas';
COMMENT ON TABLE trip_students IS 'Status dos estudantes em cada viagem';
COMMENT ON TABLE route_tracking IS 'Rastreamento em tempo real das viagens';
COMMENT ON TABLE notifications IS 'Notificações enviadas aos responsáveis';
COMMENT ON TABLE route_history IS 'Histórico completo de viagens realizadas';

-- =====================================================
-- FIM DO ESQUEMA
-- =====================================================